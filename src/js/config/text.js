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
                'tabs': {
                    'hierarchy':'Hierarchy',
                    'workflow':'Workflow'
                },
            },
            'request': {
                'title': 'Request Hierarchy',
                'tabs': {
                    'hierarchy':'Hierarchy',
                    'workflow':'Workflow'
                },
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
            'tabs': {
                'paytrans':'Payroll Transactions',
                'payroll':'Payroll Codes',
                'form':'Form Codes',
                'action':'Action Codes',
                'transaction':'Transaction Codes'
            },
        },
        'users': {
            'title': 'Admin: Users',
            'viewer': {
                'help': 'Viewers cannot submit Requests or Forms.  They may only view submitted Requests and Forms for the departments they are assigned to.'
            }
        },
    },
    'form':{
        'journal': {
            'title':'Form Journal',
            'return': 'Return to List'
        },
        'duplicate': 'There is at least one form in progress for this employee, payroll, and transaction.  Do you wish to continue creating this form?',
        'actions':{
            'save':{
                'pending': 'Saving Form',
                'success': 'Form Saved Successfully',
                'error': 'Error Saving Form'
            },
            'submit':{
                'pending': 'Submitting Form',
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
            },
            'final': {
                'pending': 'Final Approving Form',
                'success': 'Form Final Approved and Archived Successfully',
                'error': 'Error Final Approving Form'
            },
            'delete': {
                'pending': 'Deleting Form',
                'success': 'Form Deleted Successfully',
                'error': 'Error Deleting Form'
            }
        },
        'review':{
            person:{
                directory:{
                    missing_department:'No matching Department in List',
                    missing_building:'No matching Building in List'
                }
            }
        }
    },
    'request':{
        'journal': {
            'title': 'Request Journal',
            'return': 'Return to List'
        },
        'actions':{
            'save':{
                'pending': 'Saving Request',
                'success': 'Request Saved Successfully',
                'error': 'Error Saving Request'
            },
            'submit':{
                'pending': 'Submitting Request',
                'success': 'Request Submitted Successfully',
                'error': 'Error Submitting Request'
            },
            'resubmit':{
                'pending': 'Re-Submitting Request',
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
            },
            'final': {
                'pending': 'Final Approving Request',
                'success': 'Request Final Approved and Archived Successfully',
                'error': 'Error Final Approving Request'
            },
            'delete': {
                'pending': 'Deleting Request',
                'success': 'Request Deleted Successfully',
                'error': 'Error Deleting Request'
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
    },
    'test': 'This is a test message'
};

/* do not edit below this line */
export const t = memoize((key,def='') => get(text,key,def));
