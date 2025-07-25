'use strict'
/* global Pear */
const path = require('path')
const Localdrive = require('localdrive')
const c = require('compact-encoding')
const Bundle = require('bare-bundle')
const { platform, arch } = require('which-runtime')

const checkout = {
  preencode (state, m) {
    c.fixed32.preencode(state, m.key)
    c.uint.preencode(state, m.length)
    c.uint.preencode(state, m.fork)
    c.string.preencode(state, platform)
    c.string.preencode(state, arch)
  },
  encode (state, m) {
    c.fixed32.encode(state, m.key)
    c.uint.encode(state, m.length)
    c.uint.encode(state, m.fork)
    c.string.encode(state, platform)
    c.string.encode(state, arch)
  },
  decode (state) {
    return {
      key: c.fixed32.decode(state),
      length: c.uint.decode(state),
      fork: c.uint.decode(state),
      platform: c.string.decode(state),
      arch: c.string.decode(state)
    }
  }
}

async function forceUpdate (length) {
  const { platform } = await Pear.versions()
  if (platform.length >= length) return
  const swap = path.join(Pear.config.pearDir, 'current')
  const local = new Localdrive(swap, { atomic: true })
  const bundle = Bundle.from(await local.get('boot.bundle'))
  const version = { fork: 0, length, key: Pear.config.key }
  bundle.write('/checkout.js', Buffer.from(`module.exports = { key: '${version.key}', length: ${version.length}, fork: ${version.fork} }\n`))
  await local.put('boot.bundle', bundle.toBuffer())
  await local.put('checkout', c.encode(checkout, version))
  await local.close()
}

module.exports = forceUpdate
