import { Router } from "express";
import { createQuestion } from "../controllers/question.controller.js";
import authorise from "../middlewares/auth.middleware.js";

const questRouter = Router();

questRouter.get('/', (res,rep) => {
    rep.send('Get all questions');
});

questRouter.post('/', authorise, createQuestion);

questRouter.get('/:id', (res,rep) => {
    rep.send(`Get question with ID: ${res.params.id}`);
});

questRouter.put('/:id', (res,rep) => {
    rep.send(`Update question with ID: ${res.params.id}`);
}); 

questRouter.delete('/:id', (res,rep) => {
    rep.send(`Delete question with ID: ${res.params.id}`);
});

export default questRouter;