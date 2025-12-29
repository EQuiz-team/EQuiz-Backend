import { Router } from "express";

const questRouter = Router();

questRouter.get('/', (res,rep) => {
    rep.send('Get all questions');
});

questRouter.post('/', (res,rep) => {
    rep.send('Create a question');
});

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