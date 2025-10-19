import { test, expect } from '@playwright/test';

test.describe('Amy Avatar Creator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8001/');
    });

    test('should load initial UI elements', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Amy Avatar Creator');
        await expect(page.locator('#camera-input')).toBeVisible();
        await expect(page.locator('#file-input')).toBeVisible();
        await expect(page.locator('#share-avatar')).toBeVisible();
    });

    test('should handle image upload and optimization', async ({ page }) => {
        // Create a test image
        const imageBuffer = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 1200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 1200, 1200);
            return canvas.toDataURL('image/jpeg');
        });

        // Set up file input handling
        const fileInput = page.locator('#file-input');
        await fileInput.setInputFiles({
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from(imageBuffer.split(',')[1], 'base64')
        });

        // Verify image is added and optimized
        const avatarItem = page.locator('.avatar-item').first();
        await expect(avatarItem).toBeVisible();
        
        // Check preview is updated
        const preview = page.locator('#preview-image');
        await expect(preview).toBeVisible();
        
        // Verify image dimensions are optimized
        const dimensions = await preview.evaluate((img) => ({
            width: img.naturalWidth,
            height: img.naturalHeight
        }));
        expect(dimensions.width).toBeLessThanOrEqual(800);
        expect(dimensions.height).toBeLessThanOrEqual(800);
    });

    test('should support sharing', async ({ page, context }) => {
        // Mock Web Share API
        await context.addInitScript(() => {
            window.navigator.share = async () => Promise.resolve();
        });

        // Upload test image
        const fileInput = page.locator('#file-input');
        await fileInput.setInputFiles({
            name: 'test-share.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
        });

        // Try sharing
        const shareButton = page.locator('#share-avatar');
        await shareButton.click();
        
        // Since we mocked share API, just verify the button works
        await expect(page.locator('.avatar-item')).toBeVisible();
    });

    test('should handle PWA installation prompt', async ({ page }) => {
        // Mock beforeinstallprompt event
        await page.evaluate(() => {
            const event = new Event('beforeinstallprompt');
            event.prompt = () => Promise.resolve();
            event.userChoice = Promise.resolve({ outcome: 'accepted' });
            window.dispatchEvent(event);
        });

        // Verify install prompt appears
        const installPrompt = page.locator('#install-prompt');
        await expect(installPrompt).toBeVisible();

        // Click install button
        const installButton = page.locator('#install-button');
        await installButton.click();

        // Verify prompt is hidden after "installation"
        await expect(installPrompt).toBeHidden();
    });
});