import test from "node:test";
import assert from "node:assert/strict";
import {extractEurLexHtmlArticles} from "../src/lib/compliance/eurlex-html-extractor.ts";
import {compareLegalProvisions} from "../src/lib/compliance/legal-provision-diff.ts";
const wrap=(a,b)=>"<html><body>"+(" ".repeat(120))+`<p class="ti-art">Article 1</p><p>${a}</p><p class="ti-art">Article 2</p><p>${b}</p>`+"</body></html>";
test("extracts article markers and supplies document comparison",()=>{
 const before=extractEurLexHtmlArticles(wrap("Previous text","Same text"));
 const after=extractEurLexHtmlArticles(wrap("Revised text","Same text"));
 assert.equal(before.ok,true);assert.equal(after.ok,true);
 if(before.ok&&after.ok) assert.deepEqual(compareLegalProvisions(before.articles,after.articles).map(x=>[x.kind,x.identifier]),[["modified","Art. 1"]]);
});
test("rejects unstructured HTML",()=>{
 assert.equal(extractEurLexHtmlArticles("<html><body>"+("x".repeat(180))+"</body></html>").ok,false);
});
test("rejects anti-bot pages",()=>{
 assert.equal(extractEurLexHtmlArticles("<html><body>"+(" ".repeat(130))+"We need to verify that you're not a robot</body></html>").ok,false);
});
test("rejects repeated article identifiers",()=>{
 assert.equal(extractEurLexHtmlArticles(wrap("x","y").replace("Article 2","Article 1")).ok,false);
});

test("last article excludes post-act signatures and footnotes",()=>{
 const html="<html><body>"+(" ".repeat(150))+'<p class="ti-art">Article 99</p><p>Entry into force and application.</p><p>Done at Brussels, 27 April 2016.</p><p>For the Council</p></body></html>';
 const result=extractEurLexHtmlArticles(html);
 assert.equal(result.ok,true);
 if(result.ok){assert.match(result.articles[0].text,/Entry into force/);assert.doesNotMatch(result.articles[0].text,/For the Council|Done at Brussels/);}
});
