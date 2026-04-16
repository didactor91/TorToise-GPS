'use strict'

const { errors: { InputError } } = require('track-utils')

const TRACKER_EMOJIS = new Set([
    '🚚',
    '🚛',
    '🚗',
    '🚕',
    '🚌',
    '🚎',
    '🏍️',
    '🚲',
    '🚐'
])

const POI_EMOJIS = new Set([
    '📍',
    '🏢',
    '🏭',
    '🏬',
    '🏪',
    '🏥',
    '🏫',
    '🏦',
    '⛽',
    '🏠'
])

function normalizeTrackerEmoji(emoji) {
    if (!emoji) return '🚚'
    if (!TRACKER_EMOJIS.has(emoji)) throw new InputError(`invalid tracker emoji ${emoji}`)
    return emoji
}

function normalizePoiEmoji(emoji) {
    if (!emoji) return '📍'
    if (!POI_EMOJIS.has(emoji)) throw new InputError(`invalid poi emoji ${emoji}`)
    return emoji
}

module.exports = {
    TRACKER_EMOJIS,
    POI_EMOJIS,
    normalizeTrackerEmoji,
    normalizePoiEmoji
}
