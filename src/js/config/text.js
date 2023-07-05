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
    'form':{
        'actions':{
            'save':{
                'pending': 'Saving Form',
                'success': 'Form Saved Successfully',
                'error': 'Error Saving Form'
            },
            'submit':{
                'pending': 'Submittig Form',
                'success': 'Form Submitted Successfully',
                'error': 'Error Submitting Form'
            },
            'approve':{
                'pending': 'Approving Form',
                'success': 'Form Approved Successfully',
                'error': 'Error Approving Form'
            },
            'reject': {
                'pending': 'Rejecting Form',
                'success': 'Form Rejected Successfully',
                'error': 'Error Rejecting Form'
            }
        }
    },
    'request':{
        'actions':{
            'save':{
                'pending': 'Saving Request',
                'success': 'Request Saved Successfully',
                'error': 'Error Saving Request'
            },
            'submit':{
                'pending': 'Submittig Request',
                'success': 'Request Submitted Successfully',
                'error': 'Error Submitting Request'
            },
            'resubmit':{
                'pending': 'Re-Submittig Request',
                'success': 'Request Re-Submitted Successfully',
                'error': 'Error Re-Submitting Request'
            },
            'approve':{
                'pending': 'Approving Request',
                'success': 'Request Approved Successfully',
                'error': 'Error Approving Request'
            },
            'reject': {
                'pending': 'Rejecting Request',
                'success': 'Request Rejected Successfully',
                'error': 'Error Rejecting Request'
            }
        }
    },
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
