// Request Configuration and Helper Functions
import React, { useContext } from "react";

/** CONTEXT */
export const RequestContext = React.createContext();
RequestContext.displayName = 'RequestContext';
export function useRequestContext() { return useContext(RequestContext); }

/** TABS */
export const tabs = [
    {id:'information',title:'Information'},
    {id:'position',title:'Position'},
    {id:'account',title:'Account'},
    {id:'comments',title:'Comments'},
    {id:'review',title:'Review'},
];

/** Required Fields */
export const requiredFields = ['posType.id','reqType.id','effDate','orgName','comment'];

/** Field to reset */
export const resetFields = [
    'reqType.id','reqType.title',
    'payBasis.id','payBasis.title',
    'reqBudgetTitle.id','reqBudgetTitle.title',
    'currentGrade','newGrade',
    'apptStatus.id','apptStatus.title',
    'expType'
];

/** Default Form Values */
export const defaultVals = {
    "reqId": "",
    "posType": {
        "id": "",
        "title": ""
    },
    "reqType": {
        "id": "",
        "title": ""
    },
    "effDate": "",
    "newFunding": {
        "id": "",
        "title": ""
    },
    "commitmentId": "",
    "currentEmployee":[{id:"", label:""}],
    "candidateName": "",
    "bNumber": "",
    "jobDesc": "",
    "lineNumber": "",
    "newLine": false,
    "multiLines": "N",
    "numLines": "",
    "minSalary": "",
    "maxSalary": "",
    "fte": "100",
    "payBasis": {
        "id": "",
        "title": ""
    },
    "currentGrade": "",
    "newGrade": "",
    "reqBudgetTitle": {
        "id": "",
        "title": ""
    },
    "apptStatus": {
        "id": "",
        "title": ""
    },
    "apptDuration": "",
    "apptPeriod": "y",
    "tentativeEndDate": "",
    "expType": "",
    "orgName": {
        "id": "",
        "title": ""
    },
    "SUNYAccountsSplit":false,
    "SUNYAccounts": [
        {
            account:[{id:'',label:''}],
            pct:'100'
        }
    ],
    "comment": ""
};

