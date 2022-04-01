import React, { useState, useReducer, useEffect, lazy } from "react";
import { getSettings } from "../../app";
import { useQueryClient } from "react-query";
import { Row, Col, Form, Button, Alert, Tabs, Tab, Container } from "react-bootstrap";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { AppButton, Loading } from "../../blocks/components";
import { pick, invertBy, forEach, orderBy } from "lodash";
import { useToasts } from "react-toast-notifications";
import useGroupQueries from "../../queries/groups";
import useAdminQueries from "../../queries/admin";

const SettingsLists = lazy(()=>import("../../blocks/admin/settings/lists"));
const SettingsRequests = lazy(()=>import("../../blocks/admin/settings/requests"));
const SettingsForms = lazy(()=>import("../../blocks/admin/settings/forms"));

export default function AdminSettings() {
    const tabs = [
        {id:'lists',title:'Lists'},
        {id:'requests',title:'Requests'},
        {id:'forms',title:'Forms'},
        {id:'general',title:'General'}
    ];
    const settings = getSettings();

    const [activeTab,setActiveTab] = useState('lists');

    const methods = useForm({
        mode:'onSubmit',
        reValidateMode:'onChange',
        defaultValues:settings
    });

    const queryclient = useQueryClient();
    const {putSettings} = useAdminQueries();
    const update = putSettings();
    const handleSubmit = data => {
        console.log(data);
        update.mutateAsync(data).then(()=>{
            console.log('saved, reload');
            queryclient.invalidateQueries('settings');
        });
    }
    const handleError = error => {
        console.error(error);
    }
    
    return (
        <>
            <header>
                <Row>
                    <Col><h2>Settings:</h2></Col>
                </Row>
            </header>
            <Row>
                <Col>
                    <FormProvider {...methods}>
                        <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                            <Tabs activeKey={activeTab} onSelect={tab=>setActiveTab(tab)} id="sewttings-tabs">
                            {tabs.map(t=>(
                                <Tab key={t.id} eventKey={t.id} title={t.title}>
                                    <Container as="article" className="mt-3" fluid>
                                        <Row as="header">
                                            <Col as="h3">{t.title}</Col>
                                        </Row>
                                        <SettingsRouter tab={activeTab}/>
                                    </Container>
                                </Tab>
                            ))}
                            </Tabs>
                            <Row as="footer">
                                <Col className="button-group justify-content-end">
                                    <AppButton format="save" type="submit">Save Settings</AppButton>
                                </Col>
                            </Row>
                        </Form>
                    </FormProvider>
                </Col>
            </Row>
        </>
    );
}

function SettingsRouter({tab}) {
    switch(tab) {
        case "lists": return <SettingsLists/>;
        case "requests": return <SettingsRequests/>;
        case "forms": return <SettingsForms/>;
        default: return <p>Not Found</p>;
    }
}


function AdminSettingsOLD() {
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {state:'',message:''};
        switch(args) {
            case "missing": presets = {state:'warning',message:'Some lists are not set.  The application cannot be used until all lists are set.'}; break;
            case "duplicate": presets = {state:'danger',message:'You must have a unique list for each setting.  Cannot save.'}; break;
        }
        return Object.assign({},state,presets);
    },{state:'',message:''});
    const queryclient = useQueryClient();
    const settings = queryclient.getQueryData('settings');
    const {getLists} = useAppQueries();
    const {getGroups} = useGroupQueries();
    const lists = getLists();
    const groups = getGroups({select:data => orderBy(data,['GROUP_NAME'])});
    const {putSettings} = useAdminQueries();
    const update = putSettings();
    const { addToast, removeToast } = useToasts();

    const { control, handleSubmit, setError, formState:{ errors } } = useForm({
        defaultValues:Object.assign({
            posTypesList:'',
            reqTypesList:'',
            payBasisTypesList:'',
            apptTypesList:'',
            sessionTimeout:600
        },settings)
    });
    const saveSettings = data => {
        console.log(data);

        let hasDuplicates = false;
        const chk = pick(data,['posTypesList','reqTypesList','payBasisTypesList','apptTypesList']);
        forEach(invertBy(chk),(lists,value) => {
            if (value&&lists.length > 1) {
                console.log('duplicates',lists);
                hasDuplicates = true;
                lists.forEach(l=>setError(l,{type:'manual',message:'Duplicate List'}));
            }
        });
        if (hasDuplicates) {
            addToast(<><h5>Error!</h5><p>Duplicate lists. Cannot save.</p></>,{appearance:'error'});
            setStatus('duplicate');
            return false;
        }

        //warn on empty
        if (Object.values(data).filter(a=>!a).length >0) {
            setStatus('missing');
        } else {
            setStatus('');
        }

        addToast(<><h5>Saving</h5><p>Updating settings...</p></>,{appearance:'info',autoDismiss:false},id=>{
            update.mutateAsync(data).then(d=>{
                queryclient.refetchQueries('settings').then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Settings updated successfully.</p></>,{appearance:'success'});
                });
            }).catch(e=>{
                removeToast(id);
                addToast(<><h5>Error!</h5><p>Failed to update settings. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
            });
        });
    }
    useEffect(() => {
        //check the values of settings for empty/missing and set status
        if (Object.values(settings).filter(a=>!a).length >0) setStatus('missing');
    },[]);
    return (
        <>
            <Row>
                <Col><h2>Admin: Settings</h2></Col>
            </Row>
            {(lists.isError||groups.isError) && <Loading type="alert" isError>Failed to load settings</Loading>}
            {(lists.isLoading||groups.isLoading) && <Loading type="alert">Loading settings...</Loading>}
            {(lists.data&&groups.data) &&
                <>
                    {status.state && <Row><Col><Alert variant={status.state}>{status.message}</Alert></Col></Row>}
                    <Form onSubmit={handleSubmit(saveSettings)}>
                        <ListsComponent name="posTypesList" label="Position Types List" control={control} data={lists.data} errors={errors}/>
                        <ListsComponent name="reqTypesList" label="Request Types List" control={control} data={lists.data} errors={errors}/>
                        <ListsComponent name="payBasisTypesList" label="Pay Basis Types List" control={control} data={lists.data} errors={errors}/>
                        <ListsComponent name="apptTypesList" label="Appointment Types List" control={control} data={lists.data} errors={errors}/>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Allow Request Rejections:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name="requestRejections"
                                    control={control}
                                    render={({field}) => <Form.Check {...field} /> }
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Request Default Routing:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name="requestDefaultRouting"
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select">
                                            <option></option>
                                            {groups.data.map(g=><option key={g.GROUP_ID} value={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            </Col>
                        </Form.Group>                        
                        <Row>
                            <Col>
                                <Button variant="danger" type="submit">Save</Button>
                            </Col>
                        </Row>
                    </Form>
                </>
            }
        </>
    );
}

function ListsComponent({label,name,control,data,errors}) {
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>{label}:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={name}
                    control={control}
                    render={({field}) => (
                        <Form.Control {...field} as="select" isInvalid={errors[name]}>
                            <option></option>
                            {data.map(l=><option key={l.LIST_ID} value={l.LIST_ID}>{l.LIST_NAME}</option>)}
                        </Form.Control>
                    )}
                />
                <Form.Control.Feedback type="invalid">{errors[name]?.message}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}