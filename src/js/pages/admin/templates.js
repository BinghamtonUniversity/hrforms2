import React, { useState, useRef, useEffect } from "react";
import { Row, Col, Form, Alert } from "react-bootstrap";
import { AppButton } from "../../blocks/components";
import useTemplateQueries from "../../queries/template";
import { Loading, errorToast } from "../../blocks/components";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import JoditEditor from "jodit-react";
import { editorConfig } from "../../config";
import { useSettingsContext } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "../../config/text";

export default function AdminTemplates() {
    const [selectedTemplate,setSelectedTemplate] = useState('');
    const { getTemplateList } = useTemplateQueries();
    const lists = getTemplateList();
    return (
        <section>
            <section>
                <header className="mb-4">
                    <Row>
                        <Col><h2>{t('admin.templates.title')}</h2></Col>
                    </Row>
                    <Row>
                        <Col>
                            <Alert variant="warning">
                                <p className="mb-0">This page is still in development and may not fully fuction.  Use with caution.</p>
                            </Alert>
                        </Col>
                    </Row>
                </header>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Templates:</Form.Label>
                    <Col xs="auto">
                        {lists.isLoading && <Loading>Loading templates...</Loading>}
                        {lists.isError && <Loading isError>Failed to load templates</Loading>}
                        {lists.data &&
                            <Form.Control as="select" id="template" value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)}>
                                <option></option>
                                {lists.data.map(l=><option key={l.TEMPLATE_ID} value={l.TEMPLATE_ID}>{l.TEMPLATE_NAME}</option>)}
                            </Form.Control>
                        }
                    </Col>
                </Form.Group>
            </section>
            {selectedTemplate && <EditTemplate selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}/>}
        </section>
    );
}

function EditTemplate({selectedTemplate,setSelectedTemplate}) {
    const isNew = false;
    const [locked,setLocked] = useState(1);
    const [isSaving,setIsSaving] = useState(0);
    const [content,setContent] = useState('');
    const config = editorConfig('source');
    const editor = useRef();
    const { general } = useSettingsContext();
    useHotkeys('ctrl+s,ctrl+alt+s',e=>{
        e.preventDefault();
        console.log('do save');
    },{
        enableOnTags:['INPUT','TEXTAREA'],
    });
    
    const { control, setValue, handleSubmit, formState: { errors } } = useForm({defaultValues:{
        TEMPLATE_ID:'',
        TEMPLATE_NAME:'',
        TEMPLATE_TYPE:'',
        TEMPLATE_STATUS_CODE:'',
        TEMPLATE:''
    }});
    const { getTemplate, patchTemplate } = useTemplateQueries();
    const template = getTemplate(selectedTemplate,{onSuccess:d=>{
        Object.keys(d).forEach(k=>setValue(k,d[k]));
        setLocked(d.PROTECTED);
        setContent(d.TEMPLATE);
    }});
    const patch = patchTemplate(selectedTemplate);

    const saveTemplate = data => {
        setIsSaving(1);
        toast.promise(new Promise((resolve,reject) => {
            patch.mutateAsync(data).then(()=>{
                template.refetch().then(d=>{
                    setIsSaving(0);
                    resolve();
                });
            }).catch(err=>{
                setIsSaving(0);
                reject(err);
            });
        }),{
            pending:'Saving template...',
            success:'Template saved successfully',
            error:errorToast('Failed to save template')
        });
    }

    if (template.isLoading) return <Loading>Loading Template...</Loading>;
    if (template.isError) return <Loading isError>Error loading template</Loading>;
    return (
        <section>
            <Form onSubmit={handleSubmit(saveTemplate)} onReset={()=>setSelectedTemplate('')}>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Template ID:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="TEMPLATE_ID"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control {...field} plaintext readOnly/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Template Name*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="TEMPLATE_NAME"
                            defaultValue=""
                            rules={{required:{value:true,message:'You must enter a Template Name'}}}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text" disabled={locked=="1"} isInvalid={errors.LIST_NAME}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.TEMPLATE_NAME?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Template Slug*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="TEMPLATE_SLUG"
                            defaultValue=""
                            rules={{required:{value:true,message:'You must enter a Template Slug'}}}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text" disabled={locked=="1"} isInvalid={errors.LIST_NAME}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.TEMPLATE_SLUG?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Template Type*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="TEMPLATE_TYPE"
                            defaultValue=""
                            rules={{required:{value:true,message:'You must enter a Template Type'}}}
                            control={control}
                            render={({field})=>(
                                <Form.Control as="select" {...field} disabled={locked=="1"}>
                                    <option></option>
                                    <option value="S">System</option>
                                    <option value="R">Request</option>
                                    <option value="F">Form</option>
                                </Form.Control>
                            )}
                        />
                        <Form.Control.Feedback type="invalid">{errors.TEMPLATE_TYPE?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Template Status Code:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="TEMPLATE_STATUS_CODE"
                            control={control}
                            defaultValue=""
                            render={({field})=>(
                                <Form.Control as="select" {...field} disabled={locked=="1"}>
                                    <option></option>
                                    {Object.keys(general.status).map(k=><option key={k} value={k}>{k} - {general.status[k].list}</option>)}
                                </Form.Control>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="TEMPLATE">
                    <Col xs="auto">
                        <Controller 
                            name="TEMPLATE" 
                            defaultValue=""
                            control={control} 
                            render={({field:{onBlur,onChange}}) => (
                                <JoditEditor ref={editor} config={config} value={content} onBlur={v=>onBlur(v)} onChange={v=>onChange(v)} disabled={!!isSaving}/>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Row>
                    <Col className="button-group">
                        <AppButton format="save" type="submit" disabled={!!Object.keys(errors).length}>Save</AppButton>
                        {(locked!="1"&&!isNew) && <AppButton format="delete" onClick={()=>console.warn('TODO: delete template')}>Delete</AppButton>}
                        <AppButton format="cancel" variant="secondary" type="reset">Cancel</AppButton>
                    </Col>
                </Row>
            </Form>
        </section>
    );
}
/*<JoditEditor ref={editor} config={config} onBlur={field.onBlur} value={template.data?.TEMPLATE} onChange={field.onChange}/>*/