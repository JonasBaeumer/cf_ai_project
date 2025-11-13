/**
 * Test suite for System Message functionality (Phase 1)
 * Tests the foundation of server-to-client messaging
 */

import { describe, it, expect } from "vitest";
import { isSystemMessage } from "../src/types/messages";
import type { SystemMessage as SystemMessageType } from "../src/types/messages";

describe("Phase 1: System Message Infrastructure", () => {
  describe("SystemMessage Type Guard", () => {
    it("should identify valid system messages", () => {
      const validMessage: SystemMessageType = {
        role: "system",
        content: "Test message",
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(validMessage)).toBe(true);
    });

    it("should reject user messages", () => {
      const userMessage = {
        role: "user",
        content: "Hello"
      };

      expect(isSystemMessage(userMessage)).toBe(false);
    });

    it("should reject assistant messages", () => {
      const assistantMessage = {
        role: "assistant",
        content: "Hello"
      };

      expect(isSystemMessage(assistantMessage)).toBe(false);
    });

    it("should reject messages without source", () => {
      const invalidMessage = {
        role: "system",
        content: "Test",
        timestamp: Date.now()
      };

      expect(isSystemMessage(invalidMessage)).toBe(false);
    });

    it("should reject messages without timestamp", () => {
      const invalidMessage = {
        role: "system",
        content: "Test",
        source: "game_server"
      };

      expect(isSystemMessage(invalidMessage)).toBe(false);
    });

    it("should reject messages with wrong source", () => {
      const invalidMessage = {
        role: "system",
        content: "Test",
        source: "other_source",
        timestamp: Date.now()
      };

      expect(isSystemMessage(invalidMessage)).toBe(false);
    });
  });

  describe("Message Structure Validation", () => {
    it("should validate complete system message structure", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "🎮 Starting in 3...",
        source: "game_server",
        timestamp: 1234567890
      };

      expect(message.role).toBe("system");
      expect(message.source).toBe("game_server");
      expect(typeof message.timestamp).toBe("number");
      expect(typeof message.content).toBe("string");
    });

    it("should handle messages with emoji content", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "🏆 Winner! 🎉",
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.content).toContain("🏆");
      expect(message.content).toContain("🎉");
    });

    it("should handle messages with multiline content", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "Round 1\nFlag: 🇺🇸\nGuess now!",
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.content.split("\n")).toHaveLength(3);
    });

    it("should handle empty content strings", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "",
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(message)).toBe(true);
    });

    it("should handle very long content", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "A".repeat(1000),
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.content.length).toBe(1000);
    });

    it("should handle special characters in content", () => {
      const message: SystemMessageType = {
        role: "system",
        content: "Special: <>&\"'",
        source: "game_server",
        timestamp: Date.now()
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.content).toContain("<");
      expect(message.content).toContain(">");
    });
  });

  describe("Timestamp Validation", () => {
    it("should accept valid timestamps", () => {
      const now = Date.now();
      const message: SystemMessageType = {
        role: "system",
        content: "Test",
        source: "game_server",
        timestamp: now
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.timestamp).toBe(now);
    });

    it("should accept past timestamps", () => {
      const past = Date.now() - 1000000;
      const message: SystemMessageType = {
        role: "system",
        content: "Old message",
        source: "game_server",
        timestamp: past
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.timestamp).toBeLessThan(Date.now());
    });

    it("should accept future timestamps", () => {
      const future = Date.now() + 1000000;
      const message: SystemMessageType = {
        role: "system",
        content: "Future message",
        source: "game_server",
        timestamp: future
      };

      expect(isSystemMessage(message)).toBe(true);
      expect(message.timestamp).toBeGreaterThan(Date.now());
    });

    it("should reject non-numeric timestamps", () => {
      const message = {
        role: "system",
        content: "Test",
        source: "game_server",
        timestamp: "not a number"
      };

      expect(isSystemMessage(message)).toBe(false);
    });

    it("should reject null timestamps", () => {
      const message = {
        role: "system",
        content: "Test",
        source: "game_server",
        timestamp: null
      };

      expect(isSystemMessage(message)).toBe(false);
    });

    it("should reject undefined timestamps", () => {
      const message = {
        role: "system",
        content: "Test",
        source: "game_server",
        timestamp: undefined
      };

      expect(isSystemMessage(message)).toBe(false);
    });
  });
});
