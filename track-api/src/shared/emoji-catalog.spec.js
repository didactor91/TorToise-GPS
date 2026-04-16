const { errors: { InputError } } = require('track-utils')
const {
    normalizeTrackerEmoji,
    normalizePoiEmoji
} = require('./emoji-catalog')

describe('emoji catalog', () => {
    describe('normalizeTrackerEmoji', () => {
        it('returns default emoji when value is missing', () => {
            expect(normalizeTrackerEmoji(undefined)).toBe('🚚')
            expect(normalizeTrackerEmoji('')).toBe('🚚')
        })

        it('returns value when emoji is allowed', () => {
            expect(normalizeTrackerEmoji('🚲')).toBe('🚲')
        })

        it('throws InputError when tracker emoji is invalid', () => {
            expect(() => normalizeTrackerEmoji('🛸')).toThrow(InputError)
        })
    })

    describe('normalizePoiEmoji', () => {
        it('returns default emoji when value is missing', () => {
            expect(normalizePoiEmoji(undefined)).toBe('📍')
            expect(normalizePoiEmoji('')).toBe('📍')
        })

        it('returns value when emoji is allowed', () => {
            expect(normalizePoiEmoji('🏢')).toBe('🏢')
        })

        it('throws InputError when poi emoji is invalid', () => {
            expect(() => normalizePoiEmoji('🛸')).toThrow(InputError)
        })
    })
})
