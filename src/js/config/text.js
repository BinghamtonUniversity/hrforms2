/* This file is used to control the text of the application. */
import get from "lodash/get";
import memoize from "lodash/memoize";

const text = {
    'admin': {
        'departments': {
            'title': 'Admin: Departments',
        },
        'groups': {
            'title': 'Admin: Groups',
        },
        'hierarchy': {
            'form': {
                'title': 'Form Hierarchy',
            },
            'request': {
                'title': 'Request Hierarchy',
            }
        },
        'lists': {
            'title': 'Admin: Lists',
        },
        'news': {
            'title': 'Admin: News',
        },
        'settings': {
            'title': 'Admin: Settings',
        },
        'templates': {
            'title': 'Admin: Templates',
        },
        'transactions': {
            'title': 'Form Transactions',
        },
        'users': {
            'title': 'Admin: Users',
        },
    },
    'form':{},
    'request':{},
    'home': {
        'welcome': 'Welcome',
        'news': {
            'heading': 'News & Notices'
        }
    },

    'dialog': {
        'form': {
            'delete': {
                'title': 'Delete Form?',
                'message': 'Are you sure you wish to delete this form?'
            },
            'hierarchy': {
                'delete': {
                    'title': 'Delete Form Hierarchy?',
                    'message': 'Are you sure you wish to delete this hierarchy?'    
                }
            },
            'workflow': {
                'delete': {
                    'title': 'Delete Form Workflow?',
                    'message': 'Are you sure you wish to delete this hierarchy?'    
                }
            },
        },
        'request': {
            'delete': {
                'title': 'Delete?',
                'message': 'Are you sure you wish to delete this request?',
            },
            'hierarchy': {
                'delete': {
                    'title': 'Delete?',
                    'message': 'Are you sure you wish to delete this hierarchy?'    
                }
            },
            'workflow': {
                'delete': {
                    'title': 'Delete?',
                    'message': 'Are you sure you wish to delete this hierarchy?'    
                }
            },
        },
    }
};

/* do not edit below this line */
export const t = memoize((key,def='') => get(text,key,def));
