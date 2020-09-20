import { LightningElement, api } from 'lwc';

export default class ModalBox extends LightningElement {
    @api showModal = false;
    @api message;
    @api modalHeading;

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodalbox'));
    }
}