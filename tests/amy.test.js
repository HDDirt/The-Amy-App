// Amy App Test Suite
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

describe('Amy App Core', () => {
  let window;
  let document;
  
  beforeEach(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="log"></div>
      <input id="url-input" />
      <button id="open-btn">Open</button>
      <button id="preview-native-btn">Native</button>
    `);
    window = dom.window;
    document = window.document;
    
    // Mock Capacitor
    window.Capacitor = {
      Plugins: {
        App: {
          openUrl: async ({ url }) => ({ url })
        },
        Browser: {
          open: async ({ url }) => ({ url })
        }
      },
      isNative: true
    };
  });

  describe('URL Handling', () => {
    it('should handle http URLs', async () => {
      const url = 'https://example.com';
      const result = await window.openUrl(url);
      expect(result.url).to.equal(url);
    });

    it('should handle app schemes', async () => {
      const url = 'twitter://user?screen_name=test';
      const result = await window.openUrl(url);
      expect(result.url).to.equal(url);
    });
  });

  describe('Native Messaging', () => {
    it('should send native messages', () => {
      let receivedMsg;
      window.Capacitor.postMessage = (msg) => {
        receivedMsg = msg;
      };

      window.sendNativeMessage('test_cmd', { text: 'hello' });
      expect(receivedMsg.type).to.equal('test_cmd');
      expect(receivedMsg.payload.text).to.equal('hello');
    });
  });
});