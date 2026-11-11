import asyncio, sys, time
from playwright.async_api import async_playwright

URL = 'file:///home/claude/maktaba/index.html'
OUT = '/home/claude/shots/'

async def main():
    import os; os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/chrome-prof', executable_path='/usr/bin/google-chrome', viewport={'width': 1300, 'height': 900}, locale='ar')
        b = ctx
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        errs = []
        page.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        page.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        t0 = time.time()
        await page.goto(URL)
        # انتظار التثبيت
        for _ in range(600):
            await asyncio.sleep(1)
            done = await page.evaluate("document.querySelector('.choice') !== null || (document.querySelector('#view h1') && document.querySelector('#view h1').textContent.includes('مكتبة القرآن والسنة'))")
            if done: break
        print('install secs', round(time.time() - t0))
        await page.screenshot(path=OUT + '00-onboard.png')
        if await page.query_selector('[data-p=talib]'):
            await page.click('[data-p=talib]')
        await asyncio.sleep(1)
        routes = sys.argv[1:] or ['#/', '#/quran/1', '#/item/quran:2:255', '#/hadith', '#/book/bukhari', '#/item/bukhari:1', '#/item/ibnmajah:584',
                  '#/search?q=النية', '#/search?q=البقرة 255', '#/search?q=البخاري 756', '#/search?q=أحداث سنة 2 هـ', '#/search?q=جذر: ق ت ل', '#/search?q=الصلاة',
                  '#/search?q=تحريم الربا', '#/item/fiqh:fatiha-mamum', '#/qawaid', '#/sira', '#/item/sira:badr', '#/sahaba', '#/item/sahabi:umar',
                  '#/rijal', '#/item/rawi:abuzubayr', '#/mindmap/fiqh:fatiha-mamum', '#/mindmap/sira:badr', '#/saved', '#/hifz', '#/review', '#/library', '#/settings']
        for i, r in enumerate(routes):
            t = time.time()
            await page.evaluate(f"location.hash = {r!r}")
            await asyncio.sleep(1.2)
            h1 = await page.evaluate("(document.querySelector('#view h1')||{}).textContent || ''")
            info = await page.evaluate("(document.querySelector('#view .info')||{}).textContent || ''")
            warn = await page.evaluate("[...document.querySelectorAll('#view .warn')].map(w=>w.textContent).join(' | ').slice(0,160)")
            print(f'{i:02d} {r} -> {page.url.split("#")[1][:40]} | {h1[:60]} | {info[:90]} | {warn}')
            await page.screenshot(path=OUT + f'{i+1:02d}.png', full_page=False)
        print('ERRORS:', errs[:20])
        await b.close()

asyncio.run(main())
