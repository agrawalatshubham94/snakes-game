import { LightningElement, wire, track } from 'lwc';
import getTopTenScoreList from '@salesforce/apex/SnakeGameController.getTopTenScoreList';

export default class ScoreBoard extends LightningElement {
    @track scores;

    @wire(getTopTenScoreList)
    wiredScores({ error, data }) {
        if (data) {
            this.scores = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.scores = undefined;
        }
    }
}