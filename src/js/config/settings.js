
/** TABS */
export const tabs = [
    {id:'general',title:'General'},
    {id:'workflow',title:'Workflow'},
    {id:'requests',title:'Requests'},
    {id:'forms',title:'Forms'}
];

/** Default Form Values */
export const defaultVals = {
    "general": {
        "hideNews": true,
        "hideNewsExpire": 24,
        "draftLimit": 10,
        "showReqWF": "Y",
        "showFormWF": "Y",
        "showSkipped": "A",
        "awaitLabel": "Awaiting",
        "status": {
            "S": {
                "badge": "Submitted",
                "list": "Submitted"
            },
            "PA": {
                "badge": "Pending",
                "list": "Pending Approval"
            },
            "A": {
                "badge": "Approved",
                "list": "Approved"
            },
            "R": {
                "badge": "Rejected",
                "list": "Rejected"
            },
            "X": {
                "badge": "Skipped",
                "list": "Skipped"
            },
            "PF": {
                "badge": "Pending Final",
                "list": "Pending Final Approval"
            },
            "Z": {
                "badge": "Archived",
                "list": "Archived"
            }
        },
        "userRefresh": "7"
    },
    "requests": {
        "menu": {
            "drafts": {
                "title": "My Drafts",
                "showOnHome": true,
                "showOnMenu": true
            },
            "pending": {
                "title": "Pending Requests",
                "showOnHome": true,
                "showOnMenu": true
            },
            "approvals": {
                "title": "Approvals",
                "showOnHome": true,
                "showOnMenu": true
            },
            "rejections": {
                "title": "Rejections",
                "showOnHome": true,
                "showOnMenu": true,
                "enabled": true,
                "resubmit": true
            },
            "final": {
                "title": "Final Approvals",
                "showOnHome": true,
                "showOnMenu": true
            },
            "archived": {
                "title": "Archived",
                "showOnHome": false,
                "showOnMenu": true
            }
        },
        "email": {
            "enabled": false,
            "name": "HR Forms 2",
            "from": "",
            "subject": "Requests",
            "default": "",
            "errors": "",
            "status": {
                "S": {
                    "subject": "Submitted",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "PA": {
                    "subject": "Pending Approval",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "A": {
                    "subject": "Approved",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "R": {
                    "subject": "Rejected",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "X": {
                    "subject": "Skipped",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "PF": {
                    "subject": "Pending Final",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "Z": {
                    "subject": "Final Approved",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                }
            }
        },
        "workflow": {
            "default": ""
        }
    },
    "forms": {
        "menu": {
            "drafts": {
                "title": "My Drafts",
                "showOnHome": true,
                "showOnMenu": true
            },
            "pending": {
                "title": "Pending Forms",
                "showOnHome": true,
                "showOnMenu": true
            },
            "approvals": {
                "title": "Approvals",
                "showOnHome": true,
                "showOnMenu": true
            },
            "rejections": {
                "title": "Rejections",
                "showOnHome": true,
                "showOnMenu": true,
                "enabled": true,
                "resubmit": true
            },
            "final": {
                "title": "Final Approvals",
                "showOnHome": true,
                "showOnMenu": true
            },
            "archived": {
                "title": "Archived",
                "showOnHome": false,
                "showOnMenu": true
            }
        },
        "email": {
            "enabled": false,
            "name": "HR Forms 2",
            "from": "",
            "subject": "Forms",
            "default": "",
            "errors": "",
            "status": {
                "S": {
                    "subject": "Submitted",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "PA": {
                    "subject": "Pending Approval",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "A": {
                    "subject": "Approved",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "R": {
                    "subject": "Rejected",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "X": {
                    "subject": "Skipped",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "PF": {
                    "subject": "Pending Final",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                },
                "Z": {
                    "subject": "Final Approved",
                    "mailto": [],
                    "mailcc": [],
                    "replyto": "none"
                }
            }
        }
    }
};
