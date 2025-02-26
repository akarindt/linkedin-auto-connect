export default class Constants {
    public static readonly DELAY_TIME = [3000, 3500, 4000, 4500, 5000];
    public static readonly PROFILE_SELECTOR = 'ul.list-style-none[role="list"] li';
    public static readonly JOB_SELECTOR = 'div.mb1 > div:nth-of-type(2)';
    public static readonly CONNECT_BUTTON_SELECTOR = 'button[id^="ember"][aria-label^="Invite"]';
    public static readonly FOLLOW_BUTTON_SELECTOR = 'button[id^="ember"][aria-label^="Follow"]';
    public static readonly ADD_NOTE_SELECTOR = 'button[id^="ember"][aria-label^="Add"]';
    public static readonly TEXTAREA_SELECTOR = 'textarea[name="message"]#custom-message';
    public static readonly SEND_BUTTON_SELECTOR = 'button[id^="ember"][aria-label="Send invitation"]';
    public static readonly MODAL_UPSALE = 'h2#modal-upsell-header.modal-upsell__headline';
    public static readonly OUT_OF_FREE_CONNECT_MSG = 'No free personalized invitations left';
}
