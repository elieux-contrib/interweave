import { expect } from 'chai';
import Parser from '../../lib/Parser';
import EmojiMatcher from '../../lib/matchers/Emoji';
import { SHORTNAME_TO_UNICODE, UNICODE_TO_SHORTNAME } from '../../lib/data/emoji';
import { EMOJI_PATTERN, EMOJI_SHORTNAME_PATTERN } from '../../lib/constants';
import { VALID_EMOJIS, TOKEN_LOCATIONS } from '../mocks';

const VALID_UNICODE = Object.keys(UNICODE_TO_SHORTNAME);
const VALID_SHORTNAME = Object.keys(SHORTNAME_TO_UNICODE);

const INVALID_SHORTNAME = [
  ':no_ending',
  'no_beginning:',
  ':no spaces:',
  ':no#($*chars:',
];

describe('matchers/Emoji', () => {
  const matcher = new EmojiMatcher('emoji');
  const pattern = new RegExp(`^${EMOJI_PATTERN}$`, 'g');
  const shortPattern = new RegExp(`^${EMOJI_SHORTNAME_PATTERN}$`, 'i');

  describe('does match valid emoji', () => {
    VALID_UNICODE.forEach((unicode) => {
      it(`unicode: ${unicode}`, () => {
        const expected = [unicode];
        expected.index = 0;
        expected.input = unicode;

        expect(unicode.match(pattern)).to.deep.equal(expected);
      });
    });

    VALID_SHORTNAME.forEach((shortName) => {
      it(`shortname: ${shortName}`, () => {
        const expected = [shortName];
        expected.index = 0;
        expected.input = shortName;

        expect(shortName.match(shortPattern)).to.deep.equal(expected);
      });
    });
  });

  describe('doesnt match invalid emoji', () => {
    INVALID_SHORTNAME.forEach((shortName) => {
      it(`shortname: ${shortName}`, () => {
        expect(shortName.match(shortPattern)).to.equal(null);
      });
    });
  });

  describe('matches all emojis in a string', () => {
    const parser = new Parser('', {}, [matcher]);
    const createShort = shortName => matcher.factory(shortName, { shortName });

    VALID_EMOJIS.forEach(([,, shortName]) => {
      const expectedShort = [
        'no tokens',
        [createShort(shortName)],
        [' ', createShort(shortName), ' '],
        [createShort(shortName), ' pattern at beginning'],
        ['pattern at end ', createShort(shortName)],
        ['pattern in ', createShort(shortName), ' middle'],
        [createShort(shortName), ' pattern at beginning and end ', createShort(shortName)],
        [createShort(shortName), ' pattern on ', createShort(shortName), ' all sides ', createShort(shortName)],
        ['pattern ', createShort(shortName), ' used ', createShort(shortName), ' multiple ', createShort(shortName), ' times'],
        ['tokens next ', createShort(shortName), ' ', createShort(shortName), ' ', createShort(shortName), ' to each other'],
        // ['tokens without ', createShort(shortName), createShort(shortName), createShort(shortName), ' spaces'],
        ['token next to ', createShort(shortName), ', a comma'],
        ['token by a period ', createShort(shortName), '.'],
        ['token after a colon: ', createShort(shortName)],
        ['token after a\n', createShort(shortName), ' new line'],
        ['token before a ', createShort(shortName), '\n new line'],
      ];

      TOKEN_LOCATIONS.forEach((location, i) => {
        it(`for: ${shortName} - ${location}`, () => {
          const tokenString = location.replace(/\{token\}/g, shortName);
          const actual = parser.applyMatchers(tokenString);

          if (i === 0) {
            expect(actual).to.equal(expectedShort[0]);
          } else {
            expect(actual).to.deep.equal(expectedShort[i]);
          }
        });
      });
    });
  });

  describe('match()', () => {
    it('returns null for invalid shortname match', () => {
      expect(matcher.match(':invalid')).to.equal(null);
    });

    it('returns object for valid shortname match', () => {
      expect(matcher.match(':man:')).to.deep.equal({
        match: ':man:',
        shortName: ':man:',
      });
    });
  });
});