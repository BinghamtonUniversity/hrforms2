import React, { useState, useEffect, lazy, useCallback, useMemo } from "react";
import { ErrorFallback, UserContext, useUserContext, useSettingsContext } from "../app";
import { useQueryClient } from "react-query";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { Loading, AppButton, DateFormat, ModalConfirm } from "../blocks/components";
import { get, set, has, zip, cloneDeep, merge, difference, defaultTo } from "lodash";
import useFormQueries from "../queries/forms";
import { flattenObject } from "../utility";
import { allTabs, fetchFormData, initFormValues, HRFormContext, validateForm, checkFields } from "../config/form";
import { t } from "../config/text";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet";

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

export default function HRForm() {
    const [formId,setFormId] = useState('');
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);
    const [infoComplete,setInfoComplete] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = useUserContext();
    const history = useHistory();

    useEffect(() => {
        if (!id||id=="new") {
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
    if (!SUNY_ID) return (
        <Alert variant="danger">
            Error: Invalid user SUNY ID. Please contact system administrator for assistance.
        </Alert>
    );
    return(
        <HRFormWrapper 
            formId={formId} 
            isDraft={isDraft} 
            isNew={isNew} 
            infoComplete={infoComplete}
            setInfoComplete={setInfoComplete}
            reset={id=='new'}
            historyFrom={get(history,'location.state.from')}
        />
    );
}

function HRFormWrapper({formId,isDraft,isNew,infoComplete,setInfoComplete,reset,historyFrom}) {
    const [formData,setFormData] = useState();
    const [isBlocking,setIsBlocking] = useState(false);

    const {general} = useSettingsContext();

    const {getForm} = useFormQueries(formId);
    const form = getForm({enabled:false});

    const title = useMemo(() => {
        //if (isDraft) return "Draft Form"
        if (!form.data) return null;
        const status = form.data.lastJournal.STATUS;
        const statusText = get(general.status,status,{list:(isDraft)?'Draft':''});
        let tl = `Form #${formId}`;
        if (statusText.list) tl += ' - ' + statusText.list;
        return tl;
    },[formId,isDraft,form,general])

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
                    <Helmet>
                        <title>{title}</title>
                    </Helmet>
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
                reset={reset}
                historyFrom={historyFrom}
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
        //Delete if not saved
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
                    <p>
                        The form has not been saved.{' '}
                        {(isDraft)?
                            <>If you exit your draft will be <strong>discarded</strong>.</>:
                            <>If you exit your changes will not be saved.</>
                        }
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    {isDraft&&<AppButton format="delete" onClick={handleDelete}>Discard</AppButton>}
                    {!isDraft&&<AppButton format="exit" onClick={handleProceed}>Leave</AppButton>}
                    <AppButton format="close" onClick={handleClose}>Cancel</AppButton>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function HRFormForm({formId,data,setIsBlocking,isDraft,isNew,infoComplete,setInfoComplete,reset,historyFrom}) {
    //TODO: probably need to change to useReducer?
    const [tabList,setTabList] = useState(allTabs.filter(t=>t.value=='basic-info'));
    const [tabsVisited,setTabsVisited] = useState(['basic-info']);

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');
    const [showHidden,setShowHidden] = useState(true);
    const [lockTabs,setLockTabs] = useState(true);
    const [isSaving,setIsSaving] = useState(false);
    const [hasErrors,setHasErrors] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [redirect,setRedirect] = useState('');
    const [dataLoadError,setDataLoadError] = useState(undefined);
    const [showDuplicatesModal,setShowDuplicatesModal] = useState(false);
    const [showCloseModal,setShowCloseModal] = useState(false);

    const defaultVals = merge({},initFormValues,{formId:formId});
    const methods = useForm({
        mode:'onBlur',
        reValidateMode:'onChange',
        defaultValues: merge({},defaultVals,data),
        resolver: validateForm,
        context: {isNew:isNew,activeTab:activeTab,activeNav:activeNav},
    });
    const watchFormActions = useWatch({name:'formActions',control:methods.control});
    const watchIds = useWatch({name:['person.information.HR_PERSON_ID','person.information.SUNY_ID','person.information.LOCAL_CAMPUS_ID'],control:methods.control});

    const {SUNY_ID, USER_GROUPS} = useUserContext();
    const {forms} = useSettingsContext();

    const queryclient = useQueryClient();
    const {postForm,putForm,deleteForm,duplicateCheck} = useFormQueries(formId);
    const check = duplicateCheck();
    const createForm = postForm();
    const updateForm = putForm(formId);
    const delForm = deleteForm(formId);

    const history = useHistory();

    const fetchData = fetchFormData({
        watchIds:watchIds,
        effectiveDate:methods.getValues('effDate'),
        payrollCode:methods.getValues('payroll.PAYROLL_CODE')
    });

    const duplicateButtons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setIsSaving(false);
                setLockTabs(false);
                setShowDuplicatesModal(false);
            }
        },
        confirm: {
            title: 'Continue',
            callback: () => {
                setShowDuplicatesModal(false);
                methods.setValue('action','submit');
                methods.handleSubmit(handleSubmit,handleError)();
            }
        }
    };

    const handleRedirect = () => {
        queryclient.refetchQueries(SUNY_ID).then(() => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            setIsBlocking(false);
            setRedirect(defaultTo(historyFrom,'/'));
        }).catch(e => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            console.error(e);
        });
    }

    const closeButtons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShowCloseModal(false);
            }
        },
        confirm: {
            title: 'Discard',
            format: 'delete',
            callback: () => {
                setShowCloseModal(false);
                handleRedirect();
            }
        }
    }

    const navigate = tab => {
        // Change top level tab; e.g. Person, Employment, Commments, etc.
        //TODO: can we maintain last tab/sub-tab?  or should we use routing? so that it remembers when you switch
        const idx = tabList.findIndex(t=>t.value==tab);
        let aNav = '';
        if (Object.keys(tabList[idx]).includes('children')) aNav = tabList[idx].children[0].value;
        setTabsVisited(tabsVisited => Array.from(new Set([...tabsVisited,aNav||tab])));
        setActiveNav(aNav);
        setActiveTab(tab);
    }
    const navigate2 = nav => { 
        // Change sub-tab
        setTabsVisited(tabsVisited => Array.from(new Set([...tabsVisited,nav])));
        setActiveNav(nav);    
    }

    const handleSubmit = (d,e) => {
        const data = d.hasOwnProperty('formId')?d:methods.getValues(); // make sure we have data
        setHasErrors(false);
        if (!data.action) return; // just validating the form, not saving
        console.debug('Form Data:',data);
        const action = data.action;
        setIsSaving(true);
        setIsBlocking(true); //TODO: when true should be full block with no prompt?
        setLockTabs(true);
        //TODO: switch? save, submit, appove, reject?
        if (action == 'validate') {
            console.log('validate');
            setIsSaving(false);
            setIsBlocking(false);
            setLockTabs(false);
            return;
        }
        if (isDraft) {
            if (isNew || action=='submit') {
                // submit draft form
                toast.promise(new Promise((resolve,reject) => {
                    createForm.mutateAsync(data).then(d=>resolve(d)).catch(e=>reject(e));
                }),{
                    pending:t(`form.actions.${action}.pending`),
                    success: {render({data}){
                        console.debug(data);
                        handleRedirect();
                        return t(`form.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`form.actions.${action}.error`)
                    }}
                });
            } else {
                // save draft form
                toast.promise(new Promise((resolve,reject) => {
                    updateForm.mutateAsync(data).then(()=>resolve()).catch(e=>reject(e));
                }),{
                    pending: t(`form.actions.${action}.pending`),
                    success: {render(){
                        handleRedirect();
                        return t(`form.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`form.actions.${action}.error`)
                    }}
                });
            }    
        } else {
            if (data.action == 'save') {
                // approver save form
                toast.promise(new Promise((resolve,reject) => {
                    updateForm.mutateAsync(data).then(()=>resolve()).catch(e=>reject(e));
                }),{
                    pending: t(`form.actions.${action}.pending`),
                    success: {render(){
                        handleRedirect();
                        return t(`form.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`form.actions.${action}.error`)
                    }}
                });
            } else {
                // submit saved form, approve, or reject
                toast.promise(new Promise((resolve,reject) => {
                        new Promise((res,rej) => {
                            if (Object.keys(methods.formState.dirtyFields).length > 0) {
                                updateForm.mutateAsync(data).then(()=>res()).catch(e=>rej(e));
                            }
                            res();
                        }).then(()=>{
                            createForm.mutateAsync(data).then(d=>resolve(d)).catch(e=>reject(e));
                        }).catch(e=>reject(e));
                }),{
                    pending: t(`form.actions.${action}.pending`),
                    success: {render({data}){
                        console.debug(data);
                        handleRedirect();
                        return t(`form.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`form.actions.${action}.error`)
                    }}
                });
            }
        }
    }
    const handleError = errors => {
        const data = methods.getValues();
        // clear errors and call handleSubmit if only saving
        if (data.action == 'save') {
            setHasErrors(false);
            handleSubmit(data);
        } else {
            setHasErrors(true);
            console.error('Form Errors:',errors);
        }
    }
    const handleClose = () => {
        console.debug('Closing Form');
        if (isNew || methods.formState.isDirty) {
            setShowCloseModal(true);
        } else {
            handleRedirect();
        }
    }
    const handleReset = () => {
        console.debug('Resetting Form');
        /* TODO: maybe?
        // all queries used in the form need to be reset?
        queryclient.resetQueries('personLookup');
        queryclient.resetQueries('paytrans');
        */
        methods.clearErrors();
        methods.reset(defaultVals);
        setTabList(allTabs.filter(t=>t.value=='basic-info'));
        setInfoComplete(false);
        setIsBlocking(false);
        setActiveTab('basic-info');
        setActiveNav('');
        if (reset) history.push('/form/');
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
        setTabsVisited(tabsVisited => Array.from(new Set([...tabsVisited,nextNav||nextTab])));
        setActiveTab(nextTab);
        setActiveNav(nextNav);    
    }
    const handleSave = action => {
        // Duplicate form check before submit.
        if (action=='submit') {
            methods.handleSubmit(handleCheck,handleError)();
            return;
        }
        methods.setValue('action',action);
        methods.handleSubmit(handleSubmit,handleError)();
    }

    const handleCheck = (d,e) => {
        const data = d.hasOwnProperty('formId')?d:methods.getValues(); // make sure we have data
        const checkFields = {
            suny_id: data.person.information.SUNY_ID,
            bnumber: data.person.information.LOCAL_CAMPUS_ID,
            payroll: data.payroll.PAYROLL_CODE,
            form_code: data.formActions.formCode.FORM_CODE,
            action_code: data.formActions.actionCode.ACTION_CODE,
            transaction_code: data.formActions.transactionCode.TRANSACTION_CODE
        }
        check.mutateAsync(checkFields).then(d=>setShowDuplicatesModal(d?.count > 0)).catch(e=>console.error(e));
    }

    const handleTabs = useCallback(tabs => {
        if (!tabs) {
            console.debug('Reset/Clear Tabs');
            setTabList(allTabs.filter(t=>t.value=='basic-info'));
            setIsBlocking(false);
            setLockTabs(true);
            methods.setValue('formActions.TABS',[]);
        } else {
            console.debug('Display Tabs: ',tabs);
            setInfoComplete(true);
            setIsBlocking(true);
            setLockTabs(false);
            methods.setValue('formActions.TABS',tabs);
            const tlist = [allTabs.find(t=>t.value=='basic-info')];
            ['person','employment'].forEach(t=>{
                if (tabs.filter(v=>v.startsWith(t)).length>0) {
                    const subTabs = cloneDeep(allTabs.find(v=>v.value==t));
                    subTabs.children = subTabs.children.filter(s=>tabs.includes(s.value));
                    tlist.push(subTabs);
                }
            });
            tlist.push(...allTabs.filter(t=>['comments','review'].includes(t.value)));
            setTabList(tlist);
            if (isNew) {
                if (!!watchIds[0]) { 
                    // Fetch Data:
                    const promiseList = [];
                    // include position data if any employment tab exists; position data is needed for the position info box and other tabs.
                    if (tabs.some(t=>t.startsWith('employment-')) && !tabs.includes('employment-position')) tabs.push('employment-position');
                    tabs.forEach(tab => {
                        switch(tab) {
                            case "person-information": promiseList.push({tab:tab,func:fetchData.personinfo.refetch}); break;
                            case "person-demographics": promiseList.push({tab:tab,func:fetchData.persondemographics.refetch}); break;
                            case "person-directory": promiseList.push({tab:tab,func:fetchData.persondirectory.refetch}); break;
                            case "person-education": promiseList.push({tab:tab,func:fetchData.personeducation.refetch}); break;
                            case "person-contacts": promiseList.push({tab:tab,func:fetchData.personcontacts.refetch}); break;
                            case "employment-appointment": promiseList.push({tab:tab,func:fetchData.employmentappointment.refetch}); break;
                            case "employment-position": 
                                promiseList.push({tab:tab,func:fetchData.employmentposition.refetch,then:() =>{
                                    //if payroll == 28029 get student data
                                    methods.getValues('payroll.PAYROLL_CODE')=='28029' && fetchData.studentinformation.refetch().then(r=>{
                                        methods.setValue('employment.appointment.studentDetails',Object.assign({},defaultVals.employment.appointment.studentDetails,r.data));
                                    });
                                }}); 
                                break;
                            case "employment-salary": 
                                promiseList.push({tab:tab,func:fetchData.employmentsalary.refetch,then:d=>{
                                    //Remove Employment-Leave tab if Pay Basis is BIW,FEE,HRY
                                    if (['BIW','FEE','HRY'].includes(d.data?.PAY_BASIS)) {
                                        tlist.filter(t=>{
                                            if(t.hasOwnProperty('children')) {
                                                return t.children = t.children.filter(c=>c.value!='employment-leave');
                                            } else {
                                                return t;
                                            }
                                        });
                                        console.debug(`Employment-Leave Tab Removed.  Pay Basis ${d.data?.PAY_BASIS} not allowed.`);
                                        setTabList(tlist);
                                    }
                                }});
                                break;
                            case "employment-leave": promiseList.push({tab:tab,func:fetchData.employmentleave.refetch}); break;
                            case "employment-pay": promiseList.push({tab:tab,func:fetchData.employmentpay.refetch}); break;
                            case "employment-volunteer":
                                // no data needed
                                promiseList.push({tab:tab,func:()=>new Promise(resolve=>resolve({}))})
                                break;
                            case "basic-info":
                            case "employment-separation":
                            case "comments":
                            case "review":
                                console.debug('Tab Skipped - No Data: ',tab);
                                break;
                            default:
                                console.warn('Tab Not Configured:',tab);
                        }
                    });
                    Promise.all(promiseList.map(p=>p.func().then(r=>{
                        p.then&&p.then(r);
                        return r;
                    }).then(r=>{
                        const objPath = p.tab.replace('-','.');
                        const role_type = methods.getValues('selectedRow.EMPLOYMENT_ROLE_TYPE');
                        const effDate = methods.getValues('effDate');
                        switch(p.tab) {
                            case "person-education":
                                methods.setValue('person.education.institutions',r.data);
                                break;
                            case "person-contacts":
                                methods.setValue('person.contact.contacts',r.data);
                                break;
                            case "employment-position":
                                if (role_type == 'New Role') {
                                    // Reset all values to default
                                    Object.keys(initFormValues.employment.position).forEach(f => {
                                        methods.setValue(`employment.position.${f}`,initFormValues.employment.position[f]);
                                        methods.setValue(`employment.position.apptEffDate`,effDate); // use Basic Info Effective Date for Appt Effective Date.
                                    });
                                } else {
                                    methods.setValue(objPath,Object.assign({},get(defaultVals,objPath),r.data));
                                }
                                break;
                            case "employment-appointment":
                                if (role_type == 'New Role') {
                                    // Reset all values to default except facultyDetails and studentDetails
                                    difference(Object.keys(initFormValues.employment.appointment),['facultyDetails','studentDetails']).forEach(f=>{
                                        methods.setValue(`employment.appointment.${f}`,initFormValues.employment.appointment[f]);
                                    });
                                } else {
                                    methods.setValue(objPath,Object.assign({},get(defaultVals,objPath),r.data));
                                }
                                break;
                            case "employment-salary":
                                if (role_type == 'New Role') {
                                    // Reset all values to default
                                    Object.keys(initFormValues.employment.salary).forEach(f => methods.setValue(`employment.salary.${f}`,initFormValues.employment.salary[f]));
                                } else {
                                    methods.setValue(objPath,Object.assign({},get(defaultVals,objPath),r.data));
                                }
                                break;    
                            case "employment-pay":
                                methods.setValue('employment.pay.existingPay',r.data);
                                break;
                            default:
                                methods.setValue(objPath,Object.assign({},get(defaultVals,objPath),r.data));
                        }
                        return r;
                    }))).then(res=>{
                        const errors = res.find(q=>q.isError);
                        if (errors) throw new Error(errors?.error);
                    }).catch(e=>setDataLoadError({message:e.message}));
                } 
            }
        }
    },[tabList,watchIds]);

    const testHighlight = useCallback(testCondition=>(testCondition)?'':'test-highlight',[]);
    const showInTest = useMemo(()=>watchFormActions?.formCode?.FORM_CODE=='TEST'&&showHidden,[watchFormActions,showHidden]);
    const canEdit = useMemo(()=>{
        if (isDraft && SUNY_ID == get(data,'CREATED_BY_SUNY_ID',SUNY_ID)) return true;
        if (!isDraft && SUNY_ID == data.lastJournal.CREATED_BY_SUNY_ID && data.lastJournal.STATUS == 'R') return true;
        if (!isDraft && SUNY_ID == data.lastJournal.CREATED_BY_SUNY_ID) return false;
        const userGroups = (!USER_GROUPS)?[]:USER_GROUPS.split(',');
        if (userGroups.includes(get(data,'lastJournal.GROUP_TO'))) return true;
        return false;
    },[SUNY_ID,USER_GROUPS,data,isDraft]);
    const formType = useMemo(()=>[watchFormActions?.formCode?.FORM_CODE,watchFormActions?.actionCode?.ACTION_CODE,watchFormActions?.transactionCode?.TRANSACTION_CODE].join('-'),[watchFormActions]);

    useEffect(()=>!isNew && handleTabs(data.formActions.TABS),[formId]);
    useEffect(()=>(isNew&&!data.hasOwnProperty('formId'))&&handleReset(),[isNew,reset,data]); //reset form when "New"
    useEffect(()=>setIsBlocking(methods.formState.isDirty),[methods.formState.isDirty]);
    useEffect(()=>{
        // get value and merge
        const merged = Array.from(new Set(tabsVisited.concat(tabsVisited)));
        methods.setValue('tabsVisited',merged);
    },[tabsVisited]);
    useEffect(()=>{
        if (!canEdit) return; // if user cannot edit the do not validate fields
        // NOTE: for review tab get validated fields and pass as array
        // for other tabs let normal validation occur.  It operates off mounted fields.
        // If review has been visited then always validate all fields
        if (activeTab == 'review'||tabsVisited.includes('review')) {
            // Exclude fields from tabs that are not displayed.  Always include comments.
            const tabs = methods.getValues('formActions.TABS');
            console.log(tabs);
            const fields = checkFields.filter(field => {
                const t = field.split('.').slice(0,2).join('-');
                if (t == 'comment' || tabs.includes(t)) return field;
            });
            methods.trigger(fields);
        } else {
            methods.trigger();
        }
    },[methods,activeTab,activeNav,canEdit]);

    if (redirect) return <Redirect to={redirect}/>;
    if (dataLoadError) return <ErrorFallback error={dataLoadError}/>;
    return(
        <>
            <FormProvider {...methods}>
                <HRFormContext.Provider value={{
                    formId:formId,
                    createdBy:data.createdBy,
                    tabs:tabList,
                    tabsVisited:tabsVisited,
                    handleTabs:handleTabs,
                    setLockTabs:setLockTabs,
                    activeNav:activeNav,
                    isDraft:isDraft,
                    isNew:isNew,
                    infoComplete:infoComplete,
                    journalStatus:methods.getValues('lastJournal.STATUS'),
                    canEdit:canEdit,
                    formType:formType,
                    sunyId:methods.getValues('person.information.SUNY_ID'),
                    hrPersonId:methods.getValues('person.information.HR_PERSON_ID'),
                    setHasErrors:setHasErrors,
                    isTest:methods.getValues('formActions.formCode.id')=='TEST',
                    testHighlight:testHighlight,
                    showInTest:showInTest
                }}>
                    <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)} onReset={handleReset}>
                        <FormErrorsAlert/>
                        <Tabs activeKey={activeTab} onSelect={navigate} id="hr-forms-tabs" className="d-print-none">
                            {tabList.map(t => (
                                <Tab key={t.value} eventKey={t.value} title={t.label} disabled={lockTabs}>
                                    <Container as="section" className="px-0" fluid>
                                        {t.children && 
                                            <Row as="header" className="border-bottom mb-3 ml-0">
                                                <Nav activeKey={activeNav} onSelect={navigate2}>
                                                    {t.children.map(s=>(
                                                        <Nav.Item key={s.value}>
                                                            {(s.value==activeNav||lockTabs)?
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
                                        <section id={`${activeNav}`} className="px-2">
                                            <FormTabRouter tab={t.value} activeTab={activeTab} subTab={activeNav}/>
                                        </section>
                                        <Row as="footer" className="mt-3">
                                            <Col className="button-group justify-content-end d-print-none">
                                                {isDraft && 
                                                    <>
                                                        {methods.formState.isDirty && <AppButton format="undo" onClick={handleReset} disabled={isSaving}>Reset</AppButton>}
                                                        {!isNew && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}
                                                    </>
                                                }
                                                {(get(data,'lastJournal.STATUS')=='R'&&canEdit) && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}

                                                {(canEdit&&!(isNew&&lockTabs))&&<AppButton format="save-move" id="save" variant="warning" onClick={()=>handleSave('save')} disabled={isSaving||lockTabs||!methods.formState.isDirty}>Save &amp; Exit</AppButton>}
                                                
                                                <AppButton format="close" variant={isNew?'danger':'secondary'} id="close" onClick={()=>handleClose()} disabled={isSaving||lockTabs}>Close</AppButton>

                                                {activeTab!='review'&&<AppButton format="next" onClick={handleNext} disabled={lockTabs}>Next</AppButton>}
                                                
                                                {activeTab=='review'&&isDraft&&<AppButton format="submit" id="submit" variant="success" onClick={()=>handleSave('submit')} disabled={!methods.formState.isValid||hasErrors||isSaving}>Submit</AppButton>}
                                                
                                                {(activeTab=='review'&&!isDraft&&canEdit&&get(data,'lastJournal.STATUS')!='R') && 
                                                    <>
                                                        <AppButton format="reject" id="reject" onClick={()=>handleSave('reject')} disabled={!methods.formState.isValid||hasErrors||isSaving}>Reject</AppButton>
                                                        {(get(data,'lastJournal.STATUS')=='PF')?
                                                            <AppButton format="approve" id="final" onClick={()=>handleSave('final')} disabled={!methods.formState.isValid||hasErrors||isSaving}>Final Approve</AppButton>
                                                        :
                                                            <AppButton format="approve" id="approve" onClick={()=>handleSave('approve')} disabled={!methods.formState.isValid||hasErrors||isSaving}>Approve</AppButton>
                                                        }
                                                    </>
                                                }
                                                {(activeTab=='review'&&get(data,'lastJournal.STATUS')=='R'&&forms.menu.rejections.resubmit&&canEdit)&&
                                                    <AppButton format="approve" id="resubmit" onClick={()=>handleSave('resubmit')} disabled={!methods.formState.isValid||hasErrors||isSaving}>Resubmit</AppButton>
                                                }
                                            </Col>
                                        </Row>
                                        <SubmitterInfoBox/>
                                        <Row>
                                            {methods.getValues('formActions.formCode.FORM_CODE')=='TEST' &&
                                                <Col className="d-flex justify-content-end d-print-none">
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
                    <ModalConfirm show={showDuplicatesModal} icon="mdi:alert" title="Duplicate Form Found" buttons={duplicateButtons}>
                        <p>{t('form.duplicate')}</p>
                    </ModalConfirm>
                    <ModalConfirm show={showCloseModal} title="Close?" buttons={closeButtons}>
                        <p>Are you sure you want to close this form? {(isNew)?'Your form will not be saved':'Your changes will not be saved'}.</p>
                    </ModalConfirm>
                </HRFormContext.Provider>
            </FormProvider>
        </>
    );
}

function FormErrorsAlert() {
    const { formState: { errors } } = useFormContext();
    if (Object.keys(errors).length < 1) return null;
    return (
        <Alert variant="danger">
            <Alert.Heading>Form Errors:</Alert.Heading>
            <ul>
                {Object.entries(flattenObject(errors)).map(error => {
                    if (error[0].endsWith('.message')) return <li key={error[0]}>{error[1]}</li>;
                    return null;
                })}
            </ul>
        </Alert>
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
            {({canEdit}) => {
                if (canEdit) return null;
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
                <Col as="dt" sm={3} md={2} className="mb-0">Form ID:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('formId')}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">HR Person ID:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('selectedRow.HR_PERSON_ID')}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('payroll.PAYROLL_TITLE')}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('selectedRow.SUNY_ID')}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><FormTypeDisplay/></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">B-Number:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('person.information.LOCAL_CAMPUS_ID')}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{getValues('effDate')}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Name:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{getValues('person.information.FIRST_NAME')} {getValues('person.information.LEGAL_LAST_NAME')} {getValues('person.information.SUFFIX_CODE')}</Col>
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
    const apptPct = useMemo(() => {
        let pct = (!watchApptPercent)?getValues('employment.position.APPOINTMENT_PERCENT'):watchApptPercent;
        return pct||100;
    },[watchApptPercent]);
    return (
        <Row as="dl" className="mb-0">
            <Col as="dt" sm={3} md={2} className="mb-0">Line Number:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.LINE_NUMBER}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Pay Basis:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.PAY_BASIS}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Payroll:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.PAYROLL}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Negotiating Unit:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.NEGOTIATING_UNIT}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat nvl="Effective Date Not Set">{positionDetails?.EFFECTIVE_DATE}</DateFormat></Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Salary Grade:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.SALARY_GRADE}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Title:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.TITLE}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Segment Code:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.SEGMENT_CODE}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Position Department:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.POSITION_DEPARTMENT}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Position Percent:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{apptPct}</Col>
            <Col as="dt" sm={3} md={2} className="mb-0">Position Status:</Col>
            <Col as="dd" sm={9} md={4} className="mb-0">{positionDetails?.POSITION_STATUS}</Col>
        </Row>
    );
}
function SubmitterInfoBox() {
    return (
        <UserContext.Consumer>
            {({fullname,EMAIL_ADDRESS_WORK,REPORTING_DEPARTMENT_NAME}) => (
                <Alert variant="secondary" className="mt-3">
                    <Row as="dl" className="mb-0">
                        <Col as="dt" sm={3} className="mb-0">Name:</Col>
                        <Col as="dd" sm={9} className="mb-0">{fullname}</Col>
                        <Col as="dt" sm={3} className="mb-0">Email:</Col>
                        <Col as="dd" sm={9} className="mb-0">{EMAIL_ADDRESS_WORK}</Col>
                        <Col as="dt" sm={3} className="mb-0">Department:</Col>
                        <Col as="dd" sm={9} className="mb-0">{REPORTING_DEPARTMENT_NAME}</Col>
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
                <Modal.Title>{t('dialog.form.delete.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {t('dialog.form.delete.message')}
            </Modal.Body>
            <Modal.Footer>
                <AppButton format="close" onClick={handleClose}>Cancel</AppButton>
                <AppButton format="delete" onClick={handleConfirm}>Delete</AppButton> 
            </Modal.Footer>
        </Modal>
    );
} 