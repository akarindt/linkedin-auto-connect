export interface MenuItem {
    name: string;
    action: string;
    message: string;
}

export interface ExcelData {
    fullname: string;
    job: string;
    link: string;
}

export interface DefaultInstallation {
    chrome: {
        win32: string[];
        linux: string[];
        darwin: string[];
    };
    firefox: {
        win32: string[];
        linux: string[];
        darwin: string[];
    };
}

export interface BrowserJson {
    path: string;
    default: string;
}

export interface ProfileName {
    chrome: string;
    firefox: string;
}

export interface CurrentPage {
    connect_recruiter: string;
    connect_people: string;
    connect_both: string;
    follow_recruiter: string;
    follow_people: string;
    follow_both: string;
    excel_recruiter: string;
    excel_people: string;
}
