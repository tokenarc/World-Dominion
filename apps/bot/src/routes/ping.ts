import { Router } from 'express'
const router = Router()

router.get('/ping', (req, res) => {
  res.json({ 
    status: 'alive', 
    time: new Date().toISOString(),
    game: 'World Dominion'
  })
})

export default router
