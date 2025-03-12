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
    public static readonly NAME_SELECTOR = 'span[dir="ltr"] > span[aria-hidden="true"]';
    public static readonly LINK_SELECTOR =
        'a[data-test-app-aware-link]:not(.scale-down):not(.artdeco-button):not(.global-nav__primary-link):not(.query-suggestions__suggestion):not(.reusable-search-simple-insight__wrapping-link):not([target="_self"])';
    public static readonly NAME_FILTER = 'Linkedin Member';
    public static readonly SIGNIN_SELECTOR = 'div#organic-div div.header__content h1.header__content__heading';
    public static readonly PRIMARY_COLOR = 'FF0077B5';
    public static readonly FONT_COLOR = 'FFFFFFFF';
    public static readonly WAIT_SELECTOR_TIMEOUT = 10000;
}
