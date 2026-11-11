import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/chrome-prof', executable_path='/usr/bin/google-chrome', viewport={'width':1300,'height':900})
        page = ctx.pages[0]; errs=[]
        page.on('pageerror', lambda e: errs.append(str(e))); page.on('console', lambda m: m.type=='error' and errs.append(m.text))
        page.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await page.goto('file:///home/claude/maktaba/index.html#/item/bukhari:1'); await asyncio.sleep(2)
        # حفظ
        await page.click('[data-act=bookmark]'); await page.fill('[data-k=folder]','النية'); await page.click('#mOk'); await asyncio.sleep(.8)
        # هامش
        await page.click('[data-act=comment]'); await page.fill('[data-k=text]','هامش تجريبي'); await page.click('#mOk'); await asyncio.sleep(.8)
        # حفظ للمراجعة
        await page.click('[data-act=hifz]'); await asyncio.sleep(.8)
        # ملاحظة
        await page.click('#notesFab'); await page.fill('#noteText','ملاحظتي على الحديث'); await page.click('#noteSave'); await asyncio.sleep(.6)
        # وضع المراجع
        await page.click('#reviewerBtn'); await asyncio.sleep(1)
        await page.click('[data-act=rv-ok]'); await asyncio.sleep(1)
        print('status:', await page.inner_text('.actions .tag'))
        await page.click('text=التالي غير المراجع'); await asyncio.sleep(1.5); print('next ->', page.url.split('#')[1])
        await page.goto('file:///home/claude/maktaba/index.html#/saved'); await asyncio.sleep(1.2)
        print('saved h2:', await page.eval_on_selector_all('#view h2','e=>e.map(x=>x.textContent)'))
        await page.goto('file:///home/claude/maktaba/index.html#/hifz'); await asyncio.sleep(1.2)
        await page.click('#reveal'); await page.click('[data-q="4"]'); await asyncio.sleep(1)
        print('hifz:', (await page.inner_text('#view .flash'))[:80])
        await page.goto('file:///home/claude/maktaba/index.html#/review'); await asyncio.sleep(1.2)
        print('review row:', (await page.inner_text('table.t tr:nth-child(2)'))[:120])
        # استيراد CSV
        open('/tmp/test.csv','w',encoding='utf-8').write('title,year,month,place,era,category,summary,events,results,sources\nغزوة بني المصطلق,5,شعبان,المريسيع,العهد المدني,غزوة,اختبار,حدث1|حدث2,نتيجة,مصدر\n')
        await page.goto('file:///home/claude/maktaba/index.html#/library'); await asyncio.sleep(1.2)
        await page.set_input_files('#imFile','/tmp/test.csv'); await page.select_option('#imKind','event'); await page.select_option('#imBook','sira'); await page.click('#imGo'); await asyncio.sleep(2)
        print('import log:', await page.inner_text('#imLog'))
        await page.goto('file:///home/claude/maktaba/index.html#/sira?year=5'); await asyncio.sleep(1.2)
        print('sira5:', await page.eval_on_selector_all('#view .card b','e=>e.map(x=>x.textContent)'))
        await page.goto('file:///home/claude/maktaba/index.html#/mindmap/sira:badr'); await asyncio.sleep(1.2)
        await page.screenshot(path='/home/claude/shots/mm.png')
        await page.set_viewport_size({'width':400,'height':800}); await page.goto('file:///home/claude/maktaba/index.html#/item/fiqh:fatiha-mamum'); await asyncio.sleep(1.2)
        await page.screenshot(path='/home/claude/shots/mobile.png')
        print('ERR', errs); await ctx.close()
asyncio.run(main())
