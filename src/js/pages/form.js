import React, { useState, useEffect, lazy, useCallback, useMemo, useContext } from "react";
import { ErrorFallback, UserContext, useUserContext, NotFound } from "../app";
import { useQueryClient } from "react-query";
import { useParams, useHistory, Prompt, Redirect, useLocation } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { Loading, AppButton, DateFormat } from "../blocks/components";
import { get, set, has, zip, cloneDeep } from "lodash";
import usePersonQueries from "../queries/person";
import useEmploymentQueries from "../queries/employment";
import { isValid } from "date-fns";
import useFormQueries from "../queries/forms";
import { Icon } from "@iconify/react";
import { flattenObject } from "../utility";

/* CONTEXT */
export const HRFormContext = React.createContext();
HRFormContext.displayName = 'HRFormContext';
export function useHRFormContext() { return useContext(HRFormContext); }

/* TABS */
const BasicInfo = lazy(()=>import("../blocks/form/basic_info"));
const PersonInformation = lazy(()=>import("../blocks/form/person-information"));
const PersonDemographics = lazy(()=>import("../blocks/form/person-demographics"));
const PersonDirectory = lazy(()=>import("../blocks/form/person-directory"));
const PersonEducation = lazy(()=>import("../blocks/form/person-education"));
const PersonContacts = lazy(()=>import("../blocks/form/person-contacts"));
const EmploymentPosition = lazy(()=>import("../blocks/form/employment-position"));
const EmploymentAppointment = lazy(()=>import("../blocks/form/employment-appointment"));
const EmploymentSalary = lazy(()=>import("../blocks/form/employment-salary"));
const EmploymentSeparation = lazy(()=>import("../blocks/form/employment-separation"));
const EmploymentLeave = lazy(()=>import("../blocks/form/employment-leave"));
const EmploymentPay = lazy(()=>import("../blocks/form/employment-pay"));
const EmploymentVolunteer = lazy(()=>import("../blocks/form/employment-volunteer"));
const Comments = lazy(()=>import("../blocks/form/comments"));
const Review = lazy(()=>import("../blocks/form/review"));

const allTabs = [
    {value:'basic-info',label:'Basic Info'},
    {value:'person',label:'Person',children:[
        {value:'person-information',label:'Information'},
        {value:'person-demographics',label:'Demographics'},
        {value:'person-directory',label:'Directory'},
        {value:'person-education',label:'Education'},
        {value:'person-contacts',label:'Contacts'},
    ]},
    {value:'employment',label:'Employment',children:[
        {value:'employment-position',label:'Position'},
        {value:'employment-appointment',label:'Appointment'},
        {value:'employment-salary',label:'Salary'},
        {value:'employment-separation',label:'Separation'},
        {value:'employment-leave',label:'Leave'},
        {value:'employment-pay',label:'Pay'},
        {value:'employment-volunteer',label:'Volunteer'}
    ]},
    {value:'comments',label:'Comments'},
    {value:'review',label:'Review'}
];
export {allTabs}; //used on paytrans

const defaultFormActions = {
    PAYTRANS_ID:"",
    formCode:{FORM_CODE:"",FORM_TITLE:"",FORM_DESCRIPTION:""},
    actionCode:{ACTION_CODE:"",ACTION_TITLE:"",ACTION_DESCRIPTION:""},
    transactionCode:{TRANSACTION_CODE:"",TRANSACTION_TITLE:"",TRANSACTION_DESCRIPTION:""}
};
export {defaultFormActions}; //used on basic_info

export default function HRForm() {
    const [formId,setFormId] = useState('');
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);
    const [infoComplete,setInfoComplete] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = useUserContext();

    useEffect(() => {
        console.log(id,sunyid,ts);
        if (!id) {
            setIsNew(true);
            setIsDraft(true);
            setInfoComplete(false);
            setFormId(`draft-${SUNY_ID}`);
        } else {
            setIsDraft((id=='draft'));
            setFormId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
            setInfoComplete(true);
        }
    },[id,sunyid,ts]);
    if (!formId) return null;
    return(
        <HRFormWrapper 
            formId={formId} 
            isDraft={isDraft} 
            isNew={isNew} 
            infoComplete={infoComplete}
            setInfoComplete={setInfoComplete}
        />
    );
}

function HRFormWrapper({formId,isDraft,isNew,infoComplete,setInfoComplete}) {
    const [formData,setFormData] = useState();
    const [isBlocking,setIsBlocking] = useState(false);

    const {getForm} = useFormQueries(formId);
    const form = getForm({enabled:false});
    useEffect(()=>{
        if (!isNew) {
            form.refetch({throwOnError:true,cancelRefetch:true}).then(f=>{
                // Get all "Date" fields in employment and person and convert them to Date Objects
                Object.keys(flattenObject(f.data)).filter(k=>k.includes('Date')).forEach(df=> {
                    if (!df.startsWith('employment')&&!df.startsWith('person')) return;
                    const val = get(f.data,df);
                    if (val) set(f.data,df,new Date(val));
                });
                console.debug('Form Data Fetched:\n',f.data);
                setFormData(f.data);
                setInfoComplete(true);
            }).catch(e => {
                console.error(e);
            });
        } else {
            setFormData({});
        }
    },[formId,isNew]);
    if (form.isError) return <Loading type="alert" isError>Failed To Load Form Data - <small>{form.error?.name} - {form.error?.description||form.error?.message}</small></Loading>;
    if (!formData) return <Loading type="alert">Loading Form Data</Loading>;
    return (
        <section>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}HR Form</h2>
                    </Col>
                </Row>
            </header>
            {formData && <HRFormForm 
                formId={formId} 
                data={formData} 
                setIsBlocking={setIsBlocking} 
                isDraft={isDraft} 
                isNew={isNew}
                infoComplete={infoComplete}
                setInfoComplete={setInfoComplete}
            />}
            {formData && <BlockNav formId={formId} when={isBlocking} isDraft={isNew}/>}
        </section>
    );
}

function BlockNav({formId,when,isDraft}) {
    const [showModal,setShowModal] = useState(false);
    const [nextLocation,setNextLocation] = useState();
    const [shouldProceed,setShouldProceed] = useState(false);
    const {SUNY_ID} = useUserContext();
    const queryclient = useQueryClient();
    const {deleteForm} = useFormQueries(formId);
    const delForm = deleteForm();
    const history = useHistory();
    const stopNav = location => {
        if (!shouldProceed) {
            setShowModal(true);
            setNextLocation(location);
            return false;
        }
        return true;
    }
    const handleClose = () => setShowModal(false);
    const handleDelete = () => {
        setShowModal(false);
        //TODO: only delete if not saved
        delForm.mutateAsync().then(()=>{
            queryclient.refetchQueries(SUNY_ID).then(() => {
                handleProceed();
            });
        });
    }
    const handleProceed = () => {
        console.debug('proceed to location: ',nextLocation);
        setShowModal(false);
        setShouldProceed(true);
    }
    useEffect(() => shouldProceed && history.push(nextLocation.pathname),[shouldProceed]);
    return (
        <>
            <Prompt when={when} message={stopNav}/>
            <Modal show={showModal} backdrop="static" onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Exit?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    The form has not been saved.  Do you want to leave and lose your changes?
                </Modal.Body>
                <Modal.Footer>
                    {isDraft&&<Button variant="danger" onClick={handleDelete}>Discard</Button>}
                    <Button variant="primary" onClick={handleProceed}>Leave</Button>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function HRFormForm({formId,data,setIsBlocking,isDraft,isNew,infoComplete,setInfoComplete}) {
    //TODO: probably need to change to useReducer?
    const [tabList,setTabList] = useState(allTabs.filter(t=>t.value=='basic-info'));

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');
    const [showHidden,setShowHidden] = useState(true);
    const [lockTabs,setLockTabs] = useState(false);
    const [isSaving,setIsSaving] = useState(false);
    const [hasErrors,setHasErrors] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [redirect,setRedirect] = useState('');
    const [dataLoadError,setDataLoadError] = useState(undefined);

    const defaultVals = {
        formId:formId,
        lookup:{
            type:"bNumber",
            values:{
                bNumber:"",
                lastName:"",
                dob:"",
            },
        },
        selectedRow:{},
        payroll:{code:"",title:"",description:""},
        effDate:"",
        formActions:defaultFormActions,
        person: {
            information: {
                "HR_PERSON_ID":"",
                "SUNY_ID": "",
                "LOCAL_CAMPUS_ID": "",
                "SALUTATION_CODE":{"id": "","label": ""},
                "FIRST_NAME": "",
                "LEGAL_MIDDLE_NAME": "",
                "LEGAL_LAST_NAME": "",
                "SUFFIX_CODE": "",
                "VOLUNTEER_FIRE_FLAG": "",
                "REHIRE_RETIREE": "",
                "RETIREMENT_DATE": "",
                "RETIRED_FROM": "",
                "retiredDate":""
            },
            demographics: {
                "BIRTH_DATE": "",
                "US_CITIZEN_INDICATOR": "Y",
                "NON_CITIZEN_TYPE": {"id": "","label": ""},
                "EMP_AUTHORIZE_CARD_INDICATOR": "",
                "VISA_CODE": {"id": "","label": ""},
                "CITIZENSHIP_COUNTRY_CODE": {"id": "","label": ""},
                "GENDER": {"id": "","label": ""},
                "HISPANIC_FLAG": "N",
                "ETHNICITY_MULT_CODES": "",
                "ETHNICITY_SOURCE_DSC": "",
                "DISABILITY_INDICATOR": "N",
                "MILITARY_STATUS_CODE": [],
                "VETERAN_INDICATOR": "N",
                "PROTECTED_VET_STATUS_CODE": [],
                "MILITARY_SEPARATION_DATE": "",
                "birthDate":"",
                "militarySepDate":""
            },
            directory: {
                address:[],
                phone:[],
                email:[]
            },
            education:{
                institutions:[]
            },
            contact:{
                contacts:[]
            }
        },
        employment: {
            position: {
                "LINE_ITEM_NUMBER": "",
                "APPOINTMENT_TYPE": {"id": "","label": ""},
                "APPOINTMENT_PERCENT": "",
                "BENEFIT_FLAG": {"id": "","label": ""},
                "APPOINTMENT_EFFECTIVE_DATE": "",
                "APPOINTMENT_END_DATE": "",
                "VOLUNTARY_REDUCTION": "",
                "PAYROLL_MAIL_DROP_ID": {"id": "","label": ""},
                "positionDetails": {},
                "apptEffDate": "",
                "apptEndDate": "",
                "hasBenefits": false,
                "justification": {"id": "","label": ""}
            },
            appointment: {
                "TERM_DURATION": "",
                "NOTICE_DATE": "",
                "CONTINUING_PERMANENCY_DATE": "",
                "TENURE_STATUS": {"id": "", "label": ""},
                "CAMPUS_TITLE": "",
                "SUPERVISOR_SUNY_ID": "",
                "SUPERVISOR_NAME": "",
                "REPORTING_DEPARTMENT_CODE": {"id": "", "label": ""},
                "DERIVED_FAC_TYPE": "N",
                "supervisor": [],
                "noticeDate": "",
                "contPermDate": "",
                "facultyDetails": {
                    "fallCourses":{count:0,list:""},
                    "springCourses":{count:0,list:""}
                },
                "studentDetails": {
                    ACAD_HIST: "",
                    INCOMPLETES: "0",
                    MISSING_GRADES: "0",
                    SGBSTDN_TERM_CODE_EFF: "",
                    SHRLGPA_GPA: "",
                    SMRPRLE_PROGRAM_DESC: "",
                    SPRIDEN_ID: "",
                    SPRIDEN_PIDM: "",
                    STVCLAS_CODE: "",
                    STVCLAS_DESC: "",
                    STVMAJR_DESC: "",
                    STVRESD_CODE: "",
                    STVRESD_DESC: "",
                    STVRESD_IN_STATE_DESC: "",
                    STVRESD_IN_STATE_IND: "",
                    STVTERM_DESC: "",
                    "fall":{
                        "tuition":"",
                        "credits":"0"
                    },
                    "spring":{
                        "tuition":"",
                        "credits":"0"
                    },
                    "fellowship":"N",
                    "fellowshipSource":{"id":"","label":""}
                }
            },
            salary:{
                "APPOINTMENT_PERCENT": "",
                "PAY_BASIS": "",
                "RATE_EFFECTIVE_DATE": "",
                "RATE_AMOUNT": "",
                "NUMBER_OF_PAYMENTS":"1",
                "SUNY_ACCOUNTS": [],
                "EXISTING_ADDITIONAL_SALARY": [],
                "ADDITIONAL_SALARY": [],
                "SPLIT_ASSIGNMENTS":[],
                "SUNYAccountsSplit":false,
                "SUNYAccounts": [
                    {
                        account:[{id:'',label:''}],
                        pct:'100'
                    }
                ],
                "totalSalary": ""
            },
            separation: {
                lastDateWorked:""
            },
            leave: {
                origSalary:"",
                leavePercent:0,
                leaveEndDate:"",
                justification:""
            },
            pay: [],
            volunteer: {
                subRole:{id:"",label:""},
                startDate:"",
                endDate:"",
                hoursPerWeek:"",
                subRole:{id:"",label:""},
                department:{id:"",label:""},
                duties:""
            }
        },
        lastJournal:{
            STATUS:""
        },
        comment:""
    };
    const methods = useForm({defaultValues: Object.assign({},defaultVals,data)});
    const watchFormActions = useWatch({name:'formActions.formCode',control:methods.control});
    const watchIds = useWatch({name:['person.information.HR_PERSON_ID','person.information.SUNY_ID','person.information.LOCAL_CAMPUS_ID'],control:methods.control});

    const {SUNY_ID} = useUserContext();

    const queryclient = useQueryClient();
    const {postForm,putForm,deleteForm} = useFormQueries(formId);
    const createForm = postForm();
    const updateForm = putForm(formId);
    const delForm = deleteForm(formId);

    const {getPersonInfo} = usePersonQueries();
    const {getEmploymentInfo} = useEmploymentQueries();

    //** Data Fetch: TODO: move to separate functions/file? */
    const personinfo = getPersonInfo(watchIds[0],'information',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const retiredDate = new Date(d?.RETIREMENT_DATE);
            d.retiredDate = isValid(retiredDate)?retiredDate:"";
            methods.setValue('person.information',Object.assign({},defaultVals.person.information,d));
        }
    });
    const persondemographics = getPersonInfo(watchIds[0],'demographics',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const birthDate = new Date(d?.BIRTH_DATE);
            d.birthDate = isValid(birthDate)?birthDate:"";
            const milSepDate = new Date(d?.MILITARY_SEPARATION_DATE);
            d.milSepDate = isValid(milSepDate)?milSepDate:"";
            methods.setValue('person.demographics',Object.assign({},defaultVals.person.demographics,d));
        }
    });
    const persondirectory = getPersonInfo(watchIds[0],'directory',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            Object.keys(d).forEach(k => {
                d[k].forEach(v => {
                    if (v.hasOwnProperty('CREATE_DATE')) {
                        const dt = new Date(v.CREATE_DATE);
                        v.effDate = isValid(dt)?dt:"";
                        v.createDate = isValid(dt)?dt:"";
                    }
                });
            });
            methods.setValue('person.directory',Object.assign({},defaultVals.person.directory,d));
        }
    });
    const personeducation = getPersonInfo(watchIds[0],'education',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                const awardDate = new Date(o.DEGREE_YEAR,(o.DEGREE_MONTH||1)-1);
                o.awardDate = isValid(awardDate)?awardDate:"";
                o.institutionName = [{id:o.INSTITUTION_ID,label:o.INSTITUTION}];
                o.institutionCity = [o.INSTITUTION_CITY];
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
            methods.setValue('person.education.institutions',d);
        }
    });
    const personcontacts = getPersonInfo(watchIds[0],'contact',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                o.isPrimary = (o.EMR_CTC_RANK=='1')?'Y':'N';
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
            methods.setValue('person.contact.contacts',d);
        }
    });
    //Employment Info:
    const employmentappointment = getEmploymentInfo([watchIds[0],'appointment'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const noticeDate = new Date(d?.NOTICE_DATE);
            d.noticeDate = isValid(noticeDate)?noticeDate:"";
            console.log(d.noticeDate);
            const contPermDate = new Date(d?.CONTINUING_PERMANENCY_DATE);
            d.contPermDate = isValid(contPermDate)?contPermDate:"";
            console.log(d.contPermDate);
            methods.setValue('employment.appointment',Object.assign({},defaultVals.employment.appointment,d));
        }
    });
    const studentinformation = getEmploymentInfo([watchIds[2],'studentinfo'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            methods.setValue('employment.appointment.studentDetails',Object.assign({},defaultVals.employment.appointment.studentDetails,d));
        }
    });
    const employmentposition = getEmploymentInfo([watchIds[0],'position'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const apptEffDate = new Date(d?.APPOINTMENT_EFFECTIVE_DATE);
            d.apptEffDate = isValid(apptEffDate)?apptEffDate:"";
            const apptEndDate = new Date(d?.APPOINTMENT_END_DATE);
            d.apptEndDate = isValid(apptEndDate)?apptEndDate:"";
            methods.setValue('employment.position',Object.assign({},defaultVals.employment.position,d));
        }
    });
    const employmentsalary = getEmploymentInfo([watchIds[0],'salary'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const effDate = new Date(d?.RATE_EFFECTIVE_DATE);
            d.effDate = isValid(effDate)?effDate:methods.getValues('effDate');
            d.SPLIT_ASSIGNMENTS.map(a => {
                const commitmentEffDate = new Date(a?.COMMITMENT_EFFECTIVE_DATE);
                a.commitmentEffDate = isValid(commitmentEffDate)?commitmentEffDate:"";
                const commitmentEndDate = new Date(a?.COMMITMENT_END_DATE);
                a.commitmentEndDate = isValid(commitmentEndDate)?commitmentEndDate:"";
                const createDate = new Date(a?.CREATE_DATE);
                a.createDate = isValid(createDate)?createDate:"";
            });
            d.totalSalary = ((+d.RATE_AMOUNT*+d.NUMBER_OF_PAYMENTS) * (+d.APPOINTMENT_PERCENT/100)).toFixed(2);
            methods.setValue('employment.salary',Object.assign({},defaultVals.employment.salary,d));
        }
    });
    const employmentleave = getEmploymentInfo([watchIds[1],'leave',methods.getValues('effDate')],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            console.log(d);
        }
    });

    const handleRedirect = () => {
        queryclient.refetchQueries(SUNY_ID).then(() => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            setIsBlocking(false);
            setRedirect('/');
        }).catch(e => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            console.error(e);
        });
    }

    const navigate = tab => {
        //TODO: can we maintain last tab/sub-tab?  or should we use routing? so that it remembers when you switch
        const idx = tabList.findIndex(t=>t.value==tab);
        let aNav = '';
        if (Object.keys(tabList[idx]).includes('children')) aNav = tabList[idx].children[0].value;
        setActiveNav(aNav);
        setActiveTab(tab);
    }
    const navigate2 = nav => { setActiveNav(nav); }

    const handleSubmit = data => {
        console.debug(data);
        //setHasErrors(false);
        if (!data.action||data.action=='test') return; // just validating the form, not saving
        setIsSaving(true);
        setIsBlocking(true); //TODO: when true should be full block with no prompt
        setLockTabs(true);
        //TODO: switch? save, submit, appove, reject?
        //TODO: on approve need to handle changes to form.  PUT (update)
/*
 (save and isNew) or submit = POST
 (save and !isNew) or not submit = PUT
*/
        if (isNew || data.action=='submit') {
            console.log('create:',data.action);
            createForm.mutateAsync(data).then(d => {
                console.debug(d);
                handleRedirect();
            }).catch(e => {
                //TODO: for testing
                //TODO: need to handle errors better
                setIsSaving(false);
                setLockTabs(false);
                //end testing
                console.error(e);
            });
        } else {
            console.log('update:',data.action);
            updateForm.mutateAsync(data).then(() => {
                handleRedirect();
            }).catch(e => {
                console.error(e);
                setIsSaving(false);
                setLockTabs(false);    
            });
        }
    }
    const handleError = error => {
        console.log(error);
    }
    const handleReset = () => {
        if (!isNew&&isDraft) return; // cannot reset a saved form?
        console.debug('Resetting Form');
        /* TODO: maybe?
        // all queries used in the form need to be reset?
        queryclient.resetQueries('personLookup');
        queryclient.resetQueries('paytrans');
        */
        methods.reset(defaultVals);
        setTabList(allTabs.filter(t=>t.value=='basic-info'));
        setInfoComplete(false);
        setActiveTab('basic-info');
        setActiveNav('');
    }
    const handleDelete = () => {
        if (isNew&&!isDraft) return;
        //setIsBlocking(false);
        delForm.mutateAsync().then(() => {
            handleRedirect();
        }).catch(e => {
            setShowDeleteModal(false);
            console.error(e);
        });
    }
    const handleNext = tablist => {
        //TODO: should validate before?
        const tabs = (tablist instanceof Array)?tablist:tabList;
        const aTabIdx = tabs.findIndex(t=>t.value==activeTab);
        const tabListLen = tabs.length;
        const children = get(tabs,`${aTabIdx}.children`);
        const childrenLen = (children)?children.length:0;
        const aNavIdx = (children)?children.findIndex(t=>t.value==activeNav):0;
                    
        let nextNavIdx = (aNavIdx<childrenLen-1)?aNavIdx+1:aNavIdx;
        let nextTabIdx = (aNavIdx==childrenLen-1)?aTabIdx+1:aTabIdx;
        if (!children) nextTabIdx++;
        if (nextTabIdx != aTabIdx && has(tabList,`${nextTabIdx}.children`)) nextNavIdx = 0;
        if (nextTabIdx == tabListLen) nextTabIdx = aTabIdx; //don't allow tab index to exceed array length
        
        const nextTab = get(tabs,`${nextTabIdx}.value`);
        const nextNav = get(tabs,`${nextTabIdx}.children.${nextNavIdx}.value`);
        if (!nextTab) return;
        setActiveTab(nextTab);
        setActiveNav(nextNav);
    }
    const handleSave = action => {
        methods.setValue('action',action);
        methods.handleSubmit(handleSubmit,handleError)();
    }

    const handleTabs = useCallback(tabs => {
        if (!tabs) {
            console.debug('Reset/Clear Tabs');
            setTabList(allTabs.filter(t=>t.value=='basic-info'));
        } else {
            console.debug('Display Tabs: ',tabs);
            setInfoComplete(true);
            const tablist = [allTabs.find(t=>t.value=='basic-info')];
            ['person','employment'].forEach(t=>{
                if (tabs.filter(v=>v.startsWith(t)).length>0) {
                    const subTabs = cloneDeep(allTabs.find(v=>v.value==t));
                    subTabs.children = subTabs.children.filter(s=>tabs.includes(s.value));
                    tablist.push(subTabs);
                }
            });
            tablist.push(...allTabs.filter(t=>['comments','review'].includes(t.value)));
            setTabList(tablist);
            if (isNew) {
                if (!!watchIds[0]) { 
                    const promiseList = [];
                    tabs.forEach(tab => {
                        switch(tab) {
                            case "person-information": promiseList.push({func:personinfo.refetch}); break;
                            case "person-demographics": promiseList.push({func:persondemographics.refetch}); break;
                            case "person-directory": promiseList.push({func:persondirectory.refetch}); break;
                            case "person-education": promiseList.push({func:personeducation.refetch}); break;
                            case "person-contacts": promiseList.push({func:personcontacts.refetch}); break;
                            case "employment-appointment": promiseList.push({func:employmentappointment.refetch}); break;
                            case "employment-position": 
                            promiseList.push({func:employmentposition.refetch,then:() =>{
                                    //if payroll == 28029 get student data
                                    methods.getValues('payroll.code')=='28029' && studentinformation.refetch();
                                }}); 
                                break;
                            case "employment-salary": promiseList.push({func:employmentsalary.refetch}); break;
                            case "employment-leave": promiseList.push({func:employmentleave.refetch}); break;
                            case "employment-pay":
                            case "employment-volunteer":
                            case "comments":
                                console.log('TODO; Load Tab: ',tab);
                                promiseList.push({func:()=>new Promise(resolve=>resolve('done'))})
                                break;
                            case "basic-info":
                            case "employment-separation":
                            case "review":
                                console.debug('Tab Skipped - No Data: ',tab);
                                break;
                            default:
                                console.log('Tab Not Configured:',tab);
                        }
                    });
                    Promise.all(promiseList.map(prom=>prom.func().then(prom.then&&prom.then()))).then(res=>{
                        const errors = res.find(q=>q.isError);
                        if (errors) throw new Error(errors?.error);
                        handleNext(tablist);
                    }).catch(e=>setDataLoadError({message:e.message}));
                } else { // new employee; not data loaded
                    handleNext(tablist);
                }
            } else { // existing form
                handleNext(tabList);
            }
        }
    },[tabList,watchIds]);

    const testHighlight = useCallback(testCondition=>(testCondition)?'':'test-highlight',[]);
    const showInTest = useMemo(()=>watchFormActions?.FORM_CODE=='TEST'&&showHidden,[watchFormActions,showHidden]);
    const readOnly = useMemo(()=>(methods.getValues('lastJournal.STATUS')!=""&&SUNY_ID==methods.getValues('lastJournal.SUBMITTER_SUNY_ID')),[methods,SUNY_ID,formId])

    useEffect(()=>!isNew && handleTabs(data.formActions.TABS),[formId]);
    useEffect(()=>(isNew&&!data.hasOwnProperty('formId'))&&handleReset(),[isNew,data]); //reset form when "New"

    if (redirect) return <Redirect to={redirect}/>;
    if (dataLoadError) return <ErrorFallback error={dataLoadError}/>;
    return(
        <>
            {/* TODO: should we pass form type composite and payroll through HRFormsContent Provider?*/}
            <FormProvider {...methods}>
                <HRFormContext.Provider value={{
                    tabs:tabList,
                    isDraft:isDraft,
                    isNew:isNew,
                    infoComplete:infoComplete,
                    journalStatus:methods.getValues('lastJournal.STATUS'),
                    readOnly:readOnly,
                    formActions:methods.getValues('formActions'),
                    sunyId:methods.getValues('person.information.SUNY_ID'),
                    hrPersonId:methods.getValues('person.information.HR_PERSON_ID'),
                    handleTabs:handleTabs,
                    isTest:methods.getValues('formActions.formCode.id')=='TEST',
                    testHighlight:testHighlight,
                    showInTest:showInTest
                }}>
                    <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)} onReset={handleReset}>
                        <Tabs activeKey={activeTab} onSelect={navigate} id="hr-forms-tabs">
                            {tabList.map(t => (
                                <Tab key={t.value} eventKey={t.value} title={t.label} disabled={lockTabs}>
                                    <Container as="section" className="px-0" fluid>
                                        {t.children && 
                                            <Row as="header" className="border-bottom mb-3 ml-0">
                                                <Nav activeKey={activeNav} onSelect={navigate2}>
                                                    {t.children.map(s=>(
                                                        <Nav.Item key={s.value}>
                                                            {s.value==activeNav?
                                                                <p className="px-2 pt-2 pb-1 m-0 active">{s.label}</p>:
                                                                <Nav.Link eventKey={s.value} className="px-2 pt-2 pb-1">{s.label}</Nav.Link>
                                                            }
                                                        </Nav.Item>
                                                    ))}
                                                </Nav>
                                            </Row>
                                        }
                                        <PendingReviewAlert/>
                                        {!['basic-info','review'].includes(activeTab) && <FormInfoBox/>}
                                        {(activeTab == 'employment'&&['employment-appointment','employment-salary'].includes(activeNav)) && <EmploymentPositionInfoBox as="alert"/>}
                                        <div className="px-2">
                                            <FormTabRouter tab={t.value} activeTab={activeTab} subTab={activeNav}/>
                                        </div>
                                        <Row as="footer" className="mt-3">
                                            <Col className="button-group justify-content-end">
                                                {hasErrors && <div className="d-inline-flex align-items-center text-danger mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:alert"/><span>Errors</span></div>}
                                                {isSaving && <div className="d-inline-flex align-items-center mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:loading" className="spin"/><span>Saving...</span></div>}
                                                {methods.getValues('lastJournal.STATUS')=="" && 
                                                    <>
                                                        {!isNew && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}
                                                        {isNew && <AppButton format="undo" onClick={()=>handleReset()} disabled={isSaving}>Reset</AppButton>}
                                                        {(activeTab!='basic-info')&&<AppButton format="save" onClick={()=>handleSave('save')} disabled={isSaving}>Save &amp; Exit</AppButton>}
                                                    </>
                                                }
                                                {(activeTab!='review')&&<AppButton id="next" format="next" onClick={handleNext} disabled={isSaving||!infoComplete}>Next</AppButton>}
                                                {(activeTab=='review'&&methods.getValues('lastJournal.STATUS')=="")&&<AppButton id="submit" format="submit" onClick={()=>handleSave('submit')} disabled={isSaving||!infoComplete}>Submit</AppButton>}
                                                {(methods.getValues('lastJournal.STATUS')!=""&&!readOnly) && 
                                                    <>
                                                        {(activeTab=='review')&&<AppButton id="approve" format="approve" onClick={()=>handleSave('approve')} disabled={isSaving}>Approve</AppButton>}
                                                        {(activeTab=='review')&&<AppButton id="reject" format="reject" onClick={()=>handleSave('reject')} disabled={isSaving}>Reject</AppButton>}
                                                    </>
                                                }
                                                <AppButton id="submit" format="submit" variant="outline-danger" onClick={()=>handleSave('test')} disabled={isSaving}>Test Submit</AppButton>
                                            </Col>
                                        </Row>
                                        <SubmitterInfoBox/>
                                        <Row>
                                            <Col>
                                                <p>{activeTab}.{activeNav}</p>
                                            </Col>
                                            {methods.getValues('formActions.formCode.FORM_CODE')=='TEST' &&
                                                <Col className="d-flex justify-content-end">
                                                    <Form.Check type="switch" id="showHiddenToggle" className="custom-switch-lg" label="Hide/Show Fields In Test Mode" checked={showHidden} onChange={()=>setShowHidden(!showHidden)}/>
                                                </Col>
                                            }
                                        </Row>
                                    </Container>
                                </Tab>
                            ))}
                        </Tabs>
                    </Form>
                    {showDeleteModal && <DeleteFormModal setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete}/>}
                </HRFormContext.Provider>
            </FormProvider>
        </>
    );
}

function FormTabRouter({tab,activeTab,subTab,...props}) {
    if (tab != activeTab) return null;
    const r = tab + ((subTab)?'.'+subTab:'');
    switch(r) {
        case "basic-info": return <BasicInfo setPayTransTabs={props.setPayTransTabs}/>;
        case "person.person-information": return <PersonInformation/>;
        case "person.person-demographics": return <PersonDemographics/>;
        case "person.person-directory": return <PersonDirectory/>;
        case "person.person-education": return <PersonEducation/>;
        case "person.person-contacts": return <PersonContacts/>;
        case "employment.employment-position": return <EmploymentPosition/>;
        case "employment.employment-appointment": return <EmploymentAppointment/>;
        case "employment.employment-salary": return <EmploymentSalary/>;
        case "employment.employment-separation": return <EmploymentSeparation/>;
        case "employment.employment-leave": return <EmploymentLeave/>;
        case "employment.employment-pay": return <EmploymentPay/>;
        case "employment.employment-volunteer": return <EmploymentVolunteer/>;
        case "comments": return <Comments/>;
        case "review": return <Review/>;
        default: return <p>Not Found</p>;
    }
}

function PendingReviewAlert() {
    return (
        <HRFormContext.Consumer>
            {({readOnly}) => {
                if (!readOnly) return null;
                return (
                    <Alert variant="warning" className="mt-3">
                        <p className="m-0"><strong>Pending Review:</strong> This form is currently being reviewed and cannot be modified.</p>
                    </Alert>
                );
            }}
        </HRFormContext.Consumer>
    )
}

function FormInfoBox () {
    const { getValues } = useFormContext();
    return (
        <Alert variant="secondary" className="mb-3">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Form ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('formId')}</Col>
                <Col as="dt" sm={2} className="mb-0">HR Person ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('selectedRow.HR_PERSON_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('payroll.title')}</Col>
                <Col as="dt" sm={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('selectedRow.SUNY_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={4} className="mb-0"><FormTypeDisplay/></Col>
                <Col as="dt" sm={2} className="mb-0">B-Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.information.LOCAL_CAMPUS_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0"><DateFormat>{getValues('effDate')}</DateFormat></Col>
                <Col as="dt" sm={2} className="mb-0">Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.information.FIRST_NAME')} {getValues('person.information.LEGAL_LAST_NAME')} {getValues('person.information.SUFFIX_CODE')}</Col>
            </Row>
        </Alert>
    );
}
/*
Parameters:
    - variant=[null|code|title|both|list]
        - null|code: displays codes; e.g. 
                DF - - 
                EF - CCH - 641
        - title: displays titles; e.g. 
                Data Form - - 
                Employment Form - Concurrent Hire - S64.1C
        - both: displays [code]:title; e.g. 
                [DF]:Data Form - - 
                [EF]:Employment Form - [CCH]:Concurrent Hire - [641]:S64.1C
        - list: displays [codes] titles; e.g. 
                [DF//] Data Form - - 
                [EF/CCH/641] Employment Form - Concurrent Hire - S64.1C
    - separator: character(s) to separate components
*/
//TODO: add ability to pass in form data
export function FormTypeDisplay({variant,separator}) {
    const { getValues } = useFormContext();
    const formActions = getValues('formActions');
    const display = useMemo(() => {
        const codes = [formActions.formCode.FORM_CODE,formActions.actionCode.ACTION_CODE,formActions.transactionCode.TRANSACTION_CODE];
        const titles = [formActions.formCode.FORM_TITLE,formActions.actionCode.ACTION_TITLE,formActions.transactionCode.TRANSACTION_TITLE];
        return displayFormCode({variant:variant,separator:separator,codes:codes,titles:titles});
    },[variant,formActions,separator]);
    return <>{display}</>
}
export function displayFormCode({variant,separator,codes,titles}) {
    const _separator = separator||' - ';
    const _codes = codes||[];
    const _titles = titles||[];
    switch(variant) {
        case "title":
            return _titles.join(_separator);
        case "both":
            const codeTitles = zip(_codes,_titles);
            return codeTitles.map(c=>{
                if (!c[0]) return null;
                return `[${c[0]}]:${c[1]}`;
            }).join(_separator);
        case "list":
            return '['+_codes.join('/')+'] '+_titles.join(_separator);
        default:
            return _codes.join(_separator);
    }
}

export function EmploymentPositionInfoBox({as}) {
    if (as == 'alert') {
        return (
            <Alert variant="info" className="mt-3">
               <EmploymentPositionInfoBoxList/>
            </Alert> 
        );
    } else {
        return <EmploymentPositionInfoBoxList/>
    }
}
function EmploymentPositionInfoBoxList() {
    const { control, getValues } = useFormContext();
    const watchApptPercent = useWatch({name:'employment.position.APPOINTMENT_PERCENT',control:control});
    const positionDetails = getValues('employment.position.positionDetails');
    return (
        <Row as="dl" className="mb-0">
            <Col as="dt" sm={2} className="mb-0">Line Number:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.LINE_NUMBER}</Col>
            <Col as="dt" sm={2} className="mb-0">Pay Basis:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.PAY_BASIS}</Col>
            <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.PAYROLL}</Col>
            <Col as="dt" sm={2} className="mb-0">Negotiating Unit:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.NEGOTIATING_UNIT}</Col>
            <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
            <Col as="dd" sm={4} className="mb-0"><DateFormat nvl="Effective Date Not Set">{positionDetails?.EFFECTIVE_DATE}</DateFormat></Col>
            <Col as="dt" sm={2} className="mb-0">Salary Grade:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.SALARY_GRADE}</Col>
            <Col as="dt" sm={2} className="mb-0">Title:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.TITLE}</Col>
            <Col as="dt" sm={2} className="mb-0">Segment Code:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.SEGMENT_CODE}</Col>
            <Col as="dt" sm={2} className="mb-0">Position Department:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.POSITION_DEPARTMENT}</Col>
            <Col as="dt" sm={2} className="mb-0">Position Percent:</Col>
            <Col as="dd" sm={4} className="mb-0">{watchApptPercent}</Col>
            <Col as="dt" sm={2} className="mb-0">Position Status:</Col>
            <Col as="dd" sm={4} className="mb-0">{positionDetails?.POSITION_STATUS}</Col>
        </Row>
    );
}
function SubmitterInfoBox() {
    return (
        <UserContext.Consumer>
            {({fullname,EMAIL_ADDRESS_WORK,REPORTING_DEPARTMENT_NAME}) => (
                <Alert variant="secondary" className="mt-3">
                    <Row as="dl" className="mb-0">
                        <Col as="dt" sm={2} className="mb-0">Name:</Col>
                        <Col as="dd" sm={10} className="mb-0">{fullname}</Col>
                        <Col as="dt" sm={2} className="mb-0">Email:</Col>
                        <Col as="dd" sm={10} className="mb-0">{EMAIL_ADDRESS_WORK}</Col>
                        <Col as="dt" sm={2} className="mb-0">Department:</Col>
                        <Col as="dd" sm={10} className="mb-0">{REPORTING_DEPARTMENT_NAME}</Col>
                    </Row>
                </Alert>
            )}
        </UserContext.Consumer>
    );
}

function DeleteFormModal({setShowDeleteModal,handleDelete}) {
    const handleClose = () => setShowDeleteModal(false);
    const handleConfirm = () => handleDelete();
    return (
        <Modal show={true} backdrop="static" onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Delete?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
} 