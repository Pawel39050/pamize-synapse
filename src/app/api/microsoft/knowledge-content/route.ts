import {NextRequest, NextResponse} from 'next/server';
import {graphChildren, isAllowedProfile, isValidSession, makeSession, markPrivate, microsoftConfigured, microsoftProfile, refreshAccessToken, seal, secureCookie, unseal, SESSION_COOKIE, type MicrosoftSession} from '../../../../lib/microsoft-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allowedFolders = new Set(['01 – Strategia i model biznesowy','02 – Metodyki wdrażania AI','03 – Procedury operacyjne','04 – Agenci AI i Skills','05 – Manuale techniczne i bezpieczeństwo','06 – Akademia i szkolenia']);
const children = (id:string) => `/v1.0/me/drive/items/${encodeURIComponent(id)}/children?$select=id,name,folder,file,webUrl&$top=100`;
const limit = 2 * 1024 * 1024;

// Resolve membership on every request. A client-supplied item ID never grants access
// to unrelated files on the owner's drive. No tokens/document contents are logged.
export async function GET(request:NextRequest) {
  const fail = (error:string,status:number) => markPrivate(NextResponse.json({error},{status}));
  if(!microsoftConfigured()) return fail('Połącz Microsoft w Synapse.',503);
  const session = unseal<MicrosoftSession>(request.cookies.get(SESSION_COOKIE)?.value);
  if(!isValidSession(session)) return fail('Zaloguj się na konto właściciela Microsoft.',401);
  const id = request.nextUrl.searchParams.get('id');
  if(!id || id.length>200) return fail('Wybierz dokument z biblioteki.',400);
  try {
    const tokens = await refreshAccessToken(session.refreshToken);
    const profile = await microsoftProfile(tokens.access_token!);
    if(!isAllowedProfile(profile) || profile.id!==session.id) return fail('Nieprawidłowe konto Microsoft.',403);
    const roots = await graphChildren(tokens.access_token!,'/v1.0/me/drive/root/children?$select=id,name,folder&$top=100');
    const library = roots.find(item=>item.folder && item.name.normalize('NFC').trim()==='PAMIZE Synapse');
    if(!library) return fail('Brak folderu PAMIZE Synapse.',404);
    const folders = (await graphChildren(tokens.access_token!,children(library.id))).filter(item=>item.folder && allowedFolders.has(item.name.normalize('NFC').trim()));
    let found: Awaited<ReturnType<typeof graphChildren>>[number] | undefined;
    for(const folder of folders) {
      found = (await graphChildren(tokens.access_token!,children(folder.id))).find(item=>item.id===id && item.file);
      if(found) break;
    }
    if(!found) return fail('Dokument nie należy do biblioteki PAMIZE Synapse.',404);
    if(!/\.(docx|pptx|pdf|md|txt)$/i.test(found.name)) return fail('Ten format nie zawiera obsługiwanego tekstu.',415);
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(id)}/content`,{headers:{Authorization:`Bearer ${tokens.access_token}`},cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(!response.ok || !response.body) return fail('Microsoft nie udostępnił treści dokumentu.',502);
    if(Number(response.headers.get('content-length'))>limit) {await response.body.cancel();return fail('Dokument przekracza limit eksportu 2 MB.',413);}
    const reader=response.body.getReader(), chunks:Uint8Array[]=[];
    let size=0;
    while(true) {
      const chunk=await reader.read(); if(chunk.done) break;
      size+=chunk.value.byteLength;
      if(size>limit) {await reader.cancel();return fail('Dokument przekracza limit eksportu 2 MB.',413);}
      chunks.push(chunk.value);
    }
    const result=markPrivate(NextResponse.json({name:found.name,data:Buffer.concat(chunks).toString('base64'),url:found.webUrl??null,source:'OneDrive',retrievedAt:new Date().toISOString()}));
    secureCookie(result,SESSION_COOKIE,seal(makeSession(profile,tokens.refresh_token??session.refreshToken)),30*24*60*60);
    return result;
  } catch { return fail('Nie udało się odczytać dokumentu. Spróbuj ponownie lub odśwież połączenie Microsoft.',502); }
}
