import express, { Router } from 'express'
import Logger from '@ptkdev/logger'
import logger from '../utils/Logger'

class BaseController {
    public logger: Logger
    public router: Router = express.Router()
    
    constructor() {
        this.logger = logger
    }
}

export default BaseController