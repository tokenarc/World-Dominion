import { Router, Request, Response } from 'express'
import { declareWar, proposePeace, getActiveWars, getNationWars } from '../services/warService'

const router = Router()

router.get('/active', async (req: Request, res: Response) => {
  try {
    const wars = await getActiveWars()
    res.json({ wars })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wars' })
  }
})

router.get('/nation/:nationId', async (req: Request, res: Response) => {
  try {
    const wars = await getNationWars(req.params.nationId as string)
    res.json({ wars })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nation wars' })
  }
})

router.post('/declare', async (req: Request, res: Response) => {
  try {
    const { targetNationId } = req.body
    if (!req.player?.currentNation) {
      return res.status(400).json({ error: 'No nation assigned' })
    }
    const result = await declareWar(
      req.player.currentNation,
      targetNationId,
      req.player.telegramId
    )
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to declare war' })
  }
})

router.post('/peace', async (req: Request, res: Response) => {
  try {
    const { targetNationId } = req.body
    if (!req.player?.currentNation) {
      return res.status(400).json({ error: 'No nation assigned' })
    }
    const result = await proposePeace(req.player.currentNation, targetNationId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to propose peace' })
  }
})

export default router
