import {NextRequest,NextResponse} from "next/server";
import {graphChildren,MicrosoftIntegrationError,isAllowedProfile,isValidSession,makeSession,markPrivate,microsoftConfigured,microsoftGraph,microsoftProfile,refreshAccessToken,seal,secureCookie,unseal,clearCookie,SESSION_COOKIE,type GraphItem,type MicrosoftSession} from "../../../../lib/microsoft-graph";
import {knowledgeCategories,knowledgeDocuments,type KnowledgeDocument,type KnowledgeFileKind,type KnowledgeCategory} from "../../../../lib/knowledge";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const FOLDERS:{name:string;category:KnowledgeCategory}[]=[
  {name:"01 – Strategia i model biznesowy",category:"strategy"},
  {name:"02 – Metodyki wdrażania AI",category:"methods"},
  {name:"03 – Procedury operacyjne",category:"procedures"},
  {name:"04 – Agenci AI i Skills",category:"skills"},
  {name:"05 – Manuale techniczne i bezpieczeństwo",category:"technical"},
  {name:"06 – Akademia i szkolenia",category:"academy"}
];
// Discover the root folder by its Graph driveItem ID rather than path-based addressing.
// This avoids differences in OneDrive Personal path handling and encoding.
const ROOT="/v1.0/me/drive/root/children?$select=id,name,folder,file,webUrl&$top=100";
function kindOf(name:string):KnowledgeFileKind|null{
  const ext=name.split(".").pop()?.toUpperCase();
  return ext==="DOCX"||ext==="PPTX"||ext==="PDF"||ext==="TXT"||ext==="ZIP"||ext==="MD"||ext==="MP4"?ext:null;
}
function safeFileUrl(input:string|undefined):string|null {
  if(!input)return null;
  try {
    const url=new URL(input);
    return url.protocol==="https:" && (url.hostname==="onedrive.live.com" || url.hostname==="1drv.ms" || url.hostname.endsWith(".sharepoint.com"))?url.toString():null;
  }catch{return null;}
}
function folderPath(id:string):string{
  return `/v1.0/me/drive/items/${encodeURIComponent(id)}/children?$select=id,name,folder,file,webUrl,lastModifiedDateTime&$top=100`;
}
export async function GET(request:NextRequest){
  if(!microsoftConfigured()) return markPrivate(NextResponse.json({error:"Administrator nie skonfigurował aplikacji Microsoft OAuth."},{status:503}));
  const session=unseal<MicrosoftSession>(request.cookies.get(SESSION_COOKIE)?.value);
  if(!isValidSession(session))return markPrivate(NextResponse.json({error:"Microsoft nie jest połączony. Zaloguj się na konto właściciela OneDrive."},{status:401}));
  let stage="refresh_token";
  try{
    const tokens=await refreshAccessToken(session.refreshToken);
    stage="verify_identity";
    const profile=await microsoftProfile(tokens.access_token!);
    if (!isAllowedProfile(profile) || profile.id!==session.id) {
      const denied=NextResponse.json({error:"Zmieniono konto Microsoft. Dostęp zablokowany."},{status:403});
      clearCookie(denied,SESSION_COOKIE);
      return markPrivate(denied);
    }
    stage="list_drive_root";
    const driveRootItems=await graphChildren(tokens.access_token!,ROOT);
    const library=driveRootItems.find((item)=>item.folder && item.name.normalize("NFC").trim()==="PAMIZE Synapse");
    if(!library)throw new MicrosoftIntegrationError("graph_folder",404,"pamize_root_missing");
    stage="list_library_folders";
    const roots=await graphChildren(tokens.access_token!,folderPath(library.id));
    const all:KnowledgeDocument[]=[];
    const warnings:string[]=[];
    for (const folder of FOLDERS){
      const root=roots.find((item)=>item.folder && item.name.normalize("NFC").trim()===folder.name);
      if(!root){warnings.push("Brak folderu: "+folder.name);continue;}
      stage="list_folder_"+folder.category;
      const items:GraphItem[]=await graphChildren(tokens.access_token!,folderPath(root.id));
      for(const item of items) {
        if(!item.file)continue;
        const kind=kindOf(item.name),url=safeFileUrl(item.webUrl);
        if(!kind || !url)continue;
        const known=knowledgeDocuments.find((doc)=>doc.fileName===item.name);
        all.push({
          id:`graph-${item.id}`,name:known?.name??item.name.replace(/\.[^.]+$/,"").replace(/_/g," "),
          fileName:item.name,category:folder.category,kind,
          summary:known?.summary??"Dokument w osobistym OneDrive PAMIZE Synapse.",
          tags:known?.tags??[],url
        });
      }
    }
    all.sort((a,b)=>a.name.localeCompare(b.name,"pl"));
    const response=NextResponse.json({
      connected:true,source:"Microsoft Graph",mode:"live-read-only",
      synchronizedAt:new Date().toISOString(),count:all.length,
      documents:all,warnings,categoryCount:knowledgeCategories.length
    });
    // Refresh token stays in encrypted HttpOnly cookie; no Graph access token reaches the client.
    stage="save_session";
    // OAuth refresh responses can omit a replacement refresh token; retain the still-valid current token.
    secureCookie(response,SESSION_COOKIE,seal(makeSession(profile,tokens.refresh_token??session.refreshToken)),30*24*60*60);
    return markPrivate(response);
  }catch (err) {
    const info=err instanceof MicrosoftIntegrationError?err:null;
    const diagnostic={stage,httpStatus:info?.status??null,code:info?.code??"unexpected_failure"};
    // Deliberately never log OAuth tokens, account email, Graph URLs or file details.
    console.error("[Synapse OneDrive sync]",diagnostic);
    const detail=info?" (etap: "+stage+", HTTP "+info.status+", kod: "+info.code+")":" (etap: "+stage+")";
    return markPrivate(NextResponse.json({
      error:"Nie udało się zsynchronizować OneDrive"+detail+". Twoje pliki pozostają bez zmian.",
      diagnostic
    },{status:502}));
  }
}
