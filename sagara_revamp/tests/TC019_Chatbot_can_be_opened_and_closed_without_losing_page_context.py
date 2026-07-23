import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3000
        await page.goto("http://localhost:3000")
        
        # -> Click the chatbot control to close the chatbot panel so we can verify the landing page content remains visible and usable after closing.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/section[2]/div/div/div/div/div/div').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the chatbot floating action button (index 689) to close the chatbot panel, wait for the UI to update, and verify the landing page primary content (heading and feature cards) remains visible and usable.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the chatbot header close button (index 703) to close the chatbot panel, wait for the UI to update, and verify the landing page primary content (heading and feature cards) remains visible and usable after closing the chatbot.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert await frame.locator("xpath=//*[contains(., 'Welcome')]").nth(0).is_visible(), "The landing page should still display the Welcome heading after closing the chatbot."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    