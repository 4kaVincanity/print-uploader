/* global console, process */
import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { access, readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(root, 'src/public/beans-data.json')
const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })
let writeChain = Promise.resolve()

app.use(express.json({ limit: '1mb' }))

app.post('/api/illustrations/convert', upload.single('image'), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ message: '請選擇 HEIF / HEIC 圖片' })
    const type = request.file.mimetype.toLowerCase()
    const filename = request.file.originalname.toLowerCase()
    if (!['image/heif', 'image/heic'].includes(type) && !/\.hei[cf]$/.test(filename)) {
      return response.status(400).json({ message: '僅支援 HEIF / HEIC 圖片轉換' })
    }
    const png = await sharp(request.file.buffer, { limitInputPixels: 100_000_000 }).png().toBuffer()
    response.type('image/png').send(png)
  } catch (error) { next(error) }
})

const fields = ['name', 'variety', 'altitude', 'originCountry', 'process', 'roast', 'flavor', 'supplement', 'shopName']
function normalizeRecord(input, id = randomUUID()) {
  if (!input || typeof input !== 'object') throw new Error('資料格式不正確')
  const record = { id, isBlend: input.isBlend === true }
  for (const field of fields) {
    const value = input[field] ?? ''
    if (typeof value !== 'string' || value.length > 500) throw new Error(`${field} 格式不正確`)
    record[field] = value.trim()
  }
  if (!record.name) throw new Error('請輸入咖啡豆名稱')
  return record
}
async function readBeans() {
  const parsed = JSON.parse(await readFile(dataPath, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error('豆子資料庫格式不正確')
  return parsed
}
function writeBeans(records) {
  writeChain = writeChain.then(async () => {
    const temporaryPath = `${dataPath}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, dataPath)
  })
  return writeChain
}
app.get('/api/beans', async (_request, response, next) => {
  try { response.json(await readBeans()) } catch (error) { next(error) }
})
app.post('/api/beans', async (request, response, next) => {
  try {
    const records = await readBeans()
    const record = normalizeRecord(request.body)
    records.push(record)
    await writeBeans(records)
    response.status(201).json(record)
  } catch (error) { next(error) }
})
app.put('/api/beans/:id', async (request, response, next) => {
  try {
    const records = await readBeans()
    const index = records.findIndex((record) => record.id === request.params.id)
    if (index < 0) return response.status(404).json({ message: '找不到豆子資料' })
    const record = normalizeRecord(request.body, request.params.id)
    records[index] = record
    await writeBeans(records)
    response.json(record)
  } catch (error) { next(error) }
})
app.delete('/api/beans/:id', async (request, response, next) => {
  try {
    const records = await readBeans()
    const nextRecords = records.filter((record) => record.id !== request.params.id)
    if (nextRecords.length === records.length) return response.status(404).json({ message: '找不到豆子資料' })
    await writeBeans(nextRecords)
    response.status(204).end()
  } catch (error) { next(error) }
})
app.use((error, _request, response, next) => {
  void next
  response.status(400).json({ message: error.message || '資料庫操作失敗' })
})

const distPath = path.join(root, 'dist')
if (await access(distPath).then(() => true).catch(() => false)) {
  app.use(express.static(distPath))
  app.get('/{*path}', (_request, response) => response.sendFile(path.join(distPath, 'index.html')))
}
app.listen(process.env.PORT || 3001, () => console.log('Bean API listening on http://localhost:3001'))
