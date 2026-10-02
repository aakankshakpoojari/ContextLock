with open('lib/gemini-service.ts', 'rb') as f:
    content = f.read()

try:
    text = content.decode('utf-8')
    encoding = 'utf-8'
except:
    text = content.decode('utf-16')
    encoding = 'utf-16'

old = """    } catch (err) {
      console.error("Evidence retrieval provider failed:", err);
      return [];
    }"""

new = """    } catch (err) {
      console.error("Evidence retrieval provider failed:", err);
      throw err;
    }"""

if old in text:
    text = text.replace(old, new)
    with open('lib/gemini-service.ts', 'wb') as f:
        f.write(text.encode(encoding))
    print('Replaced')
else:
    # try replacing the other way
    old = old.replace('\n', '\r\n')
    new = new.replace('\n', '\r\n')
    if old in text:
        text = text.replace(old, new)
        with open('lib/gemini-service.ts', 'wb') as f:
            f.write(text.encode(encoding))
        print('Replaced (CRLF)')
    else:
        print('Not found')
