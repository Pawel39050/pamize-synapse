import test from "node:test";
import assert from "node:assert/strict";
import { extractNumberedArticles } from "../src/lib/compliance/legal-article-extractor.ts";
import { compareLegalProvisions } from "../src/lib/compliance/legal-provision-diff.ts";

test("extracts distinct articles from reviewed plain text",()=>{
  const result=extractNumberedArticles("Preamble text\nArticle 1\nFirst article rules.\nArticle 2\nSecond article rules.");
  assert.equal(result.ok,true);
  if(!result.ok) return;
  assert.deepEqual(result.articles.map(a=>a.identifier),["Art. 1","Art. 2"]);
  assert.equal(result.articles[0].text,"First article rules.");
  assert.equal(result.reviewRequired,true);
});
test("article extraction feeds deterministic article-level comparison",()=>{
  const oldText="Article 1\nOld legal wording.\nArticle 2\nUnchanged wording.";
  const newText="Article 1\nNew legal wording.\nArticle 2\nUnchanged wording.";
  const oldVersion=extractNumberedArticles(oldText),newVersion=extractNumberedArticles(newText);
  assert.equal(oldVersion.ok,true);assert.equal(newVersion.ok,true);
  if(oldVersion.ok && newVersion.ok){
    assert.deepEqual(compareLegalProvisions(oldVersion.articles,newVersion.articles).map(c=>[c.kind,c.identifier]),[["modified","Art. 1"]]);
  }
});
test("rejects duplicate headings rather than guessing",()=>{
  const result=extractNumberedArticles("Article 1\nFirst.\nArticle 1\nRepeated.");
  assert.equal(result.ok,false);
});
test("rejects raw HTML and missing articles",()=>{
  assert.equal(extractNumberedArticles("<html><body>Article 1\nLegal content.</body></html>").ok,false);
  assert.equal(extractNumberedArticles("A document without numbered articles.").ok,false);
});
test("accepts Polish article headings",()=>{
  const result=extractNumberedArticles("Artykuł 3\nTreść przepisu.\nArt. 4\nNastępny przepis.");
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.articles.map(a=>a.identifier),["Art. 3","Art. 4"]);
});
