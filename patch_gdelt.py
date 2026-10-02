import re

with open('lib/evidence/providers/gdelt.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logging before returning []
new_catch = """    } catch (err: any) {
      console.error("GDELT fetch failed:", err);
      // Adding debug logs per instructions
      console.log("[GDELT] Request URL:", url.toString());
      console.log("[GDELT] Status:", err.message && err.message.includes("Too Many Requests") ? 429 : err.message);
      console.log("[GDELT] Raw result count: 0");
      console.log("[GDELT] Parsed evidence count: 0");
      return [];
    }"""
content = re.sub(r'    } catch \(err\) {\n      console.error\("GDELT fetch failed:", err\);\n      return \[\];\n    }', new_catch, content)

# Also log successful parsing
new_success = """      const results = this.normalizeResults(data.articles).slice(0, maxRecords);
      console.log("[GDELT] Query:", query);
      console.log("[GDELT] Status:", response.status);
      console.log("[GDELT] Raw result count:", data.articles.length);
      console.log("[GDELT] Parsed evidence count:", results.length);
      return results;"""
content = re.sub(r'      return this\.normalizeResults\(data\.articles\)\.slice\(0, maxRecords\);', new_success, content)

with open('lib/evidence/providers/gdelt.ts', 'w', encoding='utf-8') as f:
    f.write(content)
