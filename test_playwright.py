import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()
        await page.goto("http://localhost:8000/rubiks-cube/index.html")

        # Wait for canvas to be present
        canvas = await page.wait_for_selector("canvas")

        # Simulate dragging the cube piece with real mouse events
        bounding_box = await canvas.bounding_box()
        # Try finding the center of the right face or simply swiping horizontally across the screen
        start_x = bounding_box['x'] + bounding_box['width'] / 2 + 50
        start_y = bounding_box['y'] + bounding_box['height'] / 2

        await page.mouse.move(start_x, start_y)
        await page.mouse.down()

        for i in range(10):
            await page.mouse.move(start_x, start_y - i * 10)
            await page.wait_for_timeout(10)

        await page.screenshot(path="rubiks_dragging.png")

        await page.mouse.up()
        await page.wait_for_timeout(500)
        await page.screenshot(path="rubiks_after_drag.png")

        await browser.close()

asyncio.run(main())
