/**
 * @copyright   2016, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 * @flow
 */

/* eslint-disable no-param-reassign */

import { generateEmoticonPermutations } from 'emojibase';
import { TEXT, EMOTICON_OPTIONS } from 'emojibase/lib/constants';

import type { Emoji } from 'emojibase';

const instances: { [locale: string]: EmojiData } = {}; // eslint-disable-line

export default class EmojiData {
  EMOJIS: { [unicode: string]: Emoji } = {};
  EMOTICON_TO_UNICODE: { [emoticon: string]: string } = {};
  SHORTCODE_TO_UNICODE: { [shortcode: string]: string } = {};
  UNICODE_TO_SHORTCODES: { [unicode: string]: string[] } = {};

  data: Emoji[] = [];
  flatData: Emoji[] = [];
  locale: string = 'en';

  constructor(locale: string) {
    this.locale = locale;
  }

  /**
   * Return or create a singleton instance per locale.
   */
  static getInstance(locale: string) {
    if (!instances[locale]) {
      instances[locale] = new EmojiData(locale);
    }

    return instances[locale];
  }

  /**
   * Return dataset as a list.
   */
  getData(): Emoji[] {
    return this.data;
  }

  /**
   * Return dataset as a flattened list.
   */
  getFlatData(): Emoji[] {
    return this.flatData;
  }

  /**
   * Package the emoji object with additional data,
   * while also extracting and partitioning relevant information.
   */
  packageEmoji(emoji: Object): Emoji {
    const { emoticon, shortcodes } = emoji;

    // Only support the default presentation (non-compact doesnt have unicode property)
    if (!emoji.unicode) {
      emoji.unicode = (emoji.text && emoji.type === TEXT) ? emoji.text : emoji.emoji;
    }

    const { unicode } = emoji;

    // Canonicalize the shortcodes for easy reuse
    emoji.canonical_shortcodes = shortcodes.map(code => `:${code}:`);
    emoji.primary_shortcode = emoji.canonical_shortcodes[0]; // eslint-disable-line

    // Support all shortcodes
    this.UNICODE_TO_SHORTCODES[unicode] = emoji.canonical_shortcodes.map((shortcode) => {
      this.SHORTCODE_TO_UNICODE[shortcode] = unicode;

      return shortcode;
    });

    // Support all emoticons
    if (emoticon) {
      generateEmoticonPermutations(emoticon, EMOTICON_OPTIONS[emoticon]).forEach((emo) => {
        this.EMOTICON_TO_UNICODE[emo] = unicode;
      });
    }

    // Map each emoji by unicode
    this.EMOJIS[unicode] = emoji;

    return emoji;
  }

  /**
   * Parse and generate emoji datasets.
   */
  parseEmojiData(data: Emoji[]): Emoji[] {
    data.forEach((emoji) => {
      const packagedEmoji = this.packageEmoji(emoji);

      this.data.push(packagedEmoji);
      this.flatData.push(packagedEmoji);

      // Flatten and package skins as well
      if (packagedEmoji.skins) {
        packagedEmoji.skins.forEach((skin) => {
          this.flatData.push(this.packageEmoji(skin));
        });
      }
    });

    return this.data;
  }
}