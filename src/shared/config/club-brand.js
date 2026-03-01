const brandByClubId = {
  '1': { abbr: 'СМ', bg: 'linear-gradient(135deg, #d51c36, #9b1022)' },
  '2': { abbr: 'Ц', bg: 'linear-gradient(135deg, #224c9a, #1a2e63)' },
  '3': { abbr: 'З', bg: 'linear-gradient(135deg, #3fa6ff, #1568c9)' },
  '4': { abbr: 'Б', bg: 'linear-gradient(135deg, #2f6df0, #1c3ba8)' },
  '5': { abbr: 'Л', bg: 'linear-gradient(135deg, #db2d3c, #17844a)' },
  '7': { abbr: 'ДМ', bg: 'linear-gradient(135deg, #5caeff, #1f5fc7)' },
  '10': { abbr: 'КС', bg: 'linear-gradient(135deg, #66b6ff, #2c66ba)' },
  '11': { abbr: 'Р', bg: 'linear-gradient(135deg, #f5c42a, #2a4ca8)' },
  '125': { abbr: 'ДМ', bg: 'linear-gradient(135deg, #2ca076, #1f6c5d)' },
  '444': { abbr: 'Ф', bg: 'linear-gradient(135deg, #2e59c5, #1b2f66)' },
  '504': { abbr: 'О', bg: 'linear-gradient(135deg, #4b75f0, #2748a6)' },
  '525': { abbr: 'С', bg: 'linear-gradient(135deg, #58c8ff, #1f7db8)' },
  '584': { abbr: 'К', bg: 'linear-gradient(135deg, #2fb568, #1f7f47)' },
  '702': { abbr: 'А', bg: 'linear-gradient(135deg, #24a46f, #1b6f53)' },
  '704': { abbr: 'НН', bg: 'linear-gradient(135deg, #7a63f0, #3a2f9c)' },
  '807': { abbr: 'Ру', bg: 'linear-gradient(135deg, #5ea545, #2f6c2c)' },
}

function toAbbr(name) {
  const safe = String(name || '').trim()
  if (!safe) {
    return '?'
  }

  const words = safe
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) {
    return '?'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

export function getClubBrand(clubId, clubName) {
  const id = String(clubId || '').trim()
  const fromMap = brandByClubId[id]

  return {
    abbr: fromMap?.abbr || toAbbr(clubName),
    bg: fromMap?.bg || 'linear-gradient(135deg, #3f9dff, #1d5fc5)',
  }
}
