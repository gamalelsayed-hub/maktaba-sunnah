import asyncio, time
from playwright.async_api import async_playwright
U='http://localhost:8765/index.html'
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/chrome-prof3', executable_path='/usr/bin/google-chrome', viewport={'width':1300,'height':1000})
        page = ctx.pages[0]; errs=[]
        page.on('pageerror', lambda e: errs.append('PE '+str(e))); page.on('console', lambda m: m.type=='error' and errs.append(m.text[:200]))
        t=time.time(); await page.goto(U)
        for _ in range(400):
            await asyncio.sleep(1)
            if await page.query_selector('[data-p=talib]'): break
        print('full install secs', round(time.time()-t))
        await page.click('[data-p=talib]'); await asyncio.sleep(1)
        print('books:', await page.evaluate("Object.values(APP.state.books).filter(b=>b.count).length"), 'items:', await page.evaluate("DB.count('items')"))
        print('sw:', await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.length)"))
        for r,w in [('#/search?q=الربا&nodirect=1',6),('#/search?q=الربا&deep=1&nodirect=1',25),('#/sira',3),('#/sira?year=5',3),('#/qawaid',3),('#/sahaba',3),('#/search?type=sahabi&q=أبو هريرة&nodirect=1',4),('#/book/mughni',3),('#/book/mughni?g='+'كتاب البيع',3),('#/ask?q=زكاة الحلي',40)]:
            await page.goto(U+r); await asyncio.sleep(w)
            info=await page.evaluate("(document.querySelector('#view .info')||{}).textContent||''")
            tabs=await page.evaluate("[...document.querySelectorAll('.tabs button, #view h2')].map(x=>x.textContent.trim()).slice(0,10).join(' | ')")
            marks=await page.evaluate("[...new Set([...document.querySelectorAll('#view mark')].map(m=>m.textContent))].slice(0,12).join('،')")
            cards=await page.evaluate("document.querySelectorAll('#view .card').length")
            print(r,'=>',info[:90],'||',tabs[:260],'|| marks:',marks,'|| cards',cards)
            await page.screenshot(path='/home/claude/shots/v3_'+str(abs(hash(r))%1000)+'.png')
        print('ERR',errs[:8]); await ctx.close()
asyncio.run(main())
