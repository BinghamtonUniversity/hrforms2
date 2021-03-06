import React, { useState, lazy } from "react";
import { useAppQueries } from "../../queries";
import { useQueryClient } from "react-query";
import { Row, Col, Form, Tabs, Tab, Container } from "react-bootstrap";
import { useForm, FormProvider } from "react-hook-form";
import { AppButton, Loading, errorToast } from "../../blocks/components";
import { toast } from "react-toastify";
import useAdminQueries from "../../queries/admin";

const SettingsLists = lazy(()=>import("../../blocks/admin/settings/lists"));
const SettingsRequests = lazy(()=>import("../../blocks/admin/settings/requests"));
const SettingsForms = lazy(()=>import("../../blocks/admin/settings/forms"));
const SettingsGeneral = lazy(()=>import("../../blocks/admin/settings/general"));

export default function AdminSettings() {
    const {getSettings} = useAppQueries();
    const settings = getSettings();
    if (settings.isError) return <Loading isError>Error Loading Settings</Loading>
    if (settings.isLoading) return <Loading>Loading Settings</Loading>
    return <AdminSettingsTabs settingsData={settings.data}/>
}

function AdminSettingsTabs({settingsData}) {
    const tabs = [
        {id:'general',title:'General'},
        {id:'requests',title:'Requests'},
        {id:'forms',title:'Forms'}
    ];
//        {id:'lists',title:'Lists'},

    const [activeTab,setActiveTab] = useState('general');

    const methods = useForm({defaultValues:settingsData});

    const queryclient = useQueryClient();
    const {putSettings} = useAdminQueries();
    const update = putSettings();
    const handleSubmit = data => {
        console.debug(data);
        toast.promise(update.mutateAsync(data),{
            pending:'Saving Settings...',
            success:{
                render:() => {
                    queryclient.invalidateQueries('settings');
                    return 'Settings saved successfully';    
                }
            },
            error:errorToast('Failed saving settings')
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
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Row>
                        <Col>
                            <Tabs activeKey={activeTab} onSelect={tab=>setActiveTab(tab)} id="settings-tabs">
                                {tabs.map(t=>(
                                    <Tab key={t.id} eventKey={t.id} title={t.title}>
                                        <Container as="article" className="mt-3" fluid>
                                            <Row as="header">
                                                <Col as="h3">{t.title}</Col>
                                            </Row>
                                            <SettingsRouter tab={t.id}/>
                                        </Container>
                                    </Tab>
                                ))}
                            </Tabs>
                        </Col>
                    </Row>
                    <Row as="footer">
                        <Col className="button-group justify-content-end">
                            <AppButton format="save" type="submit">Save Settings</AppButton>
                        </Col>
                    </Row>
                </Form>
            </FormProvider>
        </>
    );
}

function SettingsRouter({tab}) {
    switch(tab) {
        case "general": return <SettingsGeneral/>;
        case "lists": return <SettingsLists/>;
        case "requests": return <SettingsRequests/>;
        case "forms": return <SettingsForms/>;
        default: return <p>Not Found</p>;
    }
}
