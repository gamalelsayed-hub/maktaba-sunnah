import asyncio, time
from playwright.async_api import async_playwright
U='file:///home/claude/maktaba-sunnah/index.html'
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/chrome-prof', executable_path='/usr/bin/google-chrome', viewport={'width':1300,'height':1000})
        page = ctx.pages[0]; errs=[]
        page.on('pageerror', lambda e: errs.append('PE '+str(e))); page.on('console', lambda m: m.type=='error' and errs.append(m.text[:200]))
        page.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await page.goto(U)
        for _ in range(200):
            await asyncio.sleep(1)
            if await page.query_selector('[data-p=talib]') or 'مكتبة القرآن والسنة' in (await page.evaluate("(document.querySelector('#view h1')||{}).textContent||''")): break
        if await page.query_selector('[data-p=talib]'): await page.click('[data-p=talib]')
        await page.goto(U+'#/library'); await asyncio.sleep(2)
        t=time.time()
        await page.evaluate("IMPORT.installPacks((i,n,t,m)=>console.log(t,m), ['fath','mughni','tafsir-ibnkathir','tafsir-qurtubi','bidayat','sharh-nawawi','taqrib'])")
        print('optional install secs', round(time.time()-t))
        await page.evaluate("APP.loadMeta().then(()=>DB.invalidate())"); await asyncio.sleep(1)
        for r in ['#/item/bukhari:756','#/item/quran:2:255','#/item/fath:756','#/book/fath','#/book/mughni','#/book/tafsir-ibnkathir','#/item/muslim:4927','#/ask?q=قراءة الفاتحة خلف الإمام','#/search?q=زكاة الحلي&deep=1&nodirect=1','#/talab','#/talab?track=general','#/talab?track=special&science=hadith','#/rijal','#/library?cq=الموطأ']:
            await page.goto(U+r); 
            await asyncio.sleep(14 if 'ask' in r or 'deep' in r else 3)
            h1=await page.evaluate("(document.querySelector('#view h1')||{}).textContent||''")
            h2=await page.evaluate("[...document.querySelectorAll('#view h2')].map(x=>x.textContent.trim()).slice(0,9).join(' | ')")
            info=await page.evaluate("(document.querySelector('#view .info')||{}).textContent||''")
            print(r,'=>',h1[:50],'||',h2[:300],'||',info[:120])
            await page.screenshot(path='/home/claude/shots/n_'+r.replace('#/','').replace('/','_').replace('?','_')[:30]+'.png')
        print('ERR',errs[:10]); await ctx.close()
asyncio.run(main())
