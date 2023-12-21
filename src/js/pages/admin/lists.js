import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form, ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import { useForm, Controller, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import camelCase from "lodash/camelCase";
import { Loading, ModalConfirm, AppButton, errorToast } from "../../blocks/components";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "../../config/text";
import useListsQueries from "../../queries/lists";
import { Helmet } from "react-helmet";

export default function AdminLists() {
    const [selectedList,setSelectedList] = useState();
    const [isNewList,setIsNewList] = useState(false);
    const [slugHint,setSlugHint] = useState('');
    const [confirmDelete,setConfirmDelete] = useState(false);
    const [confirmSave,setConfirmSave] = useState(false);
    const [runSQL,setRunSQL] = useState('');

    const { getLists, getList, postList, putList, deleteList } = useListsQueries();
    const lists = getLists();
    const listdetails = getList(selectedList,{enabled:false});
    const queryclient = useQueryClient();
    const createlist = postList();
    const updatelist = putList(selectedList);
    const deletelist = deleteList(selectedList);

    const defaultValues = {
        LIST_ID:'',
        LIST_NAME:'',
        LIST_DESCRIPTION:'',
        LIST_TYPE:'',
        LIST_SLUG:'',
        PROTECTED:'',
        LIST_DATA:''
    };
    const methods = useForm({defaultValues:defaultValues});
    
    const handleBlur = e => {
        const [listId,listSlug] = methods.getValues(['LIST_ID','LIST_SLUG']);
        const listSlugCc = camelCase(listSlug);
        if (e.target.name == 'LIST_NAME') {
            if (listSlug == '' || listSlug != listSlugCc) {
                methods.setValue('LIST_SLUG',camelCase(e.target.value));
                methods.trigger('LIST_SLUG');
            }
            setSlugHint(camelCase(e.target.value));
        }
        if (e.target.name == 'LIST_SLUG') {
            if (listSlug != listSlugCc) {
                methods.setError('LIST_SLUG',{type:'manual',message:'Invalid List Slug'});
                return false;
            }
            const chk = lists.data.find(a=>a.LIST_SLUG==listSlug)?.LIST_ID;
            if (chk && chk != listId) {
                methods.setError('LIST_SLUG',{type:'manual',message:'List Slug already in use'});
                return false;
            }
        }
    }
    const pickSlugHint = () => methods.setValue('LIST_SLUG',slugHint);
    const newList = () => {
        setSelectedList('');
        setIsNewList(true);
        setRunSQL('');
        resetState();
        methods.setValue('LIST_ID','new');
        ['LIST_NAME','LIST_DESCRIPTION','LIST_TYPE','LIST_SLUG','PROTECTED','LIST_DATA'].forEach(k=>methods.setValue(k,''));
    }
    useHotkeys('ctrl+alt+n',()=>newList());
    
    const handleDeleteList = () => setConfirmDelete(true);
    const confirmDeleteButtons = {
        close:{title:'Cancel',callback:()=>setConfirmDelete(false)},
        confirm:{title:'Delete',variant:'danger',callback:()=>{
            setConfirmDelete(false);
            toast.promise(new Promise((resolve,reject) => {
                deletelist.mutateAsync(selectedList).then(()=>{
                    queryclient.refetchQueries('lists',{exact:true}).then(() => {
                        setSelectedList('');
                        setRunSQL('');
                        resolve();
                    }).catch(err=>reject(err))
                }).catch(err=>reject(err));
            }),{
                pending: 'Deleting list...',
                success: 'List deleted successfully',
                error: errorToast('Failed to delete list')
            });
        }}
    };
    const saveList = data =>{
        //TODO: make this a promise and test SQL remotely
        if (data.LIST_TYPE=='json') {
            try {
                JSON.parse(data.LIST_DATA);
            } catch(e) {
                methods.setError("LIST_DATA",{type:'manual',message:'Invalid JSON',},{shouldFocus:true});
                return false;    
            }
        }
        if (data.LIST_TYPE == 'list') {
            try {
                const list = JSON.parse(data.LIST_DATA);
                if (list.filter(l=>l.length!=2).length != 0) {
                    methods.setError("LIST_DATA",{type:'manual',message:'Invalid List',},{shouldFocus:true});
                    return false;
                }
            } catch(e) {
                methods.setError("LIST_DATA",{type:'manual',message:'Invalid List',},{shouldFocus:true});
                return false;    
            }
        }
        if (data.LIST_TYPE == 'sql') {
            const sql = data.LIST_DATA.toLowerCase();
            if (![';','delete','update','insert'].every(t=>!sql.includes(t))) {
                methods.setError("LIST_DATA",{type:'manual',message:'Invalid SQL',},{shouldFocus:true});
                return false;                    
            }
        }
        setConfirmSave(true);
    }
    const confirmSaveButtons = {
        close:{title:'Cancel',callback:()=>{
            setConfirmSave(false);
            methods.reset();
        }},
        confirm:{title:'Save',callback:()=>{
            setConfirmSave(false);
            const data = methods.getValues();
            if (isNewList) {
                toast.promise(new Promise((resolve,reject) => {
                    createlist.mutateAsync(data).then(d=>{
                        queryclient.refetchQueries('lists',{exact:true}).then(() => {
                            setSelectedList(d.LIST_ID);
                            setRunSQL('');
                            resolve();
                        }).catch(err=>reject(err));
                    }).catch(err=>reject(err));
                }),{
                    pending: 'Creating new list...',
                    success: 'List created successfully',
                    error: errorToast('Failed to create list')
                });
            } else if (selectedList) {
                toast.promise(new Promise((resolve,reject) => {
                    updatelist.mutateAsync(data).then(()=>{
                        Promise.all([
                            queryclient.refetchQueries('lists',{exact:true}),
                            queryclient.refetchQueries(['list',selectedList],{exact:true})
                        ]).then(()=>{
                            queryclient.invalidateQueries(['listdata',data.LIST_SLUG],{exact:true,refetchInactive:true});
                            queryclient.invalidateQueries(['listdata',data.LIST_ID],{exact:true,refetchInactive:true});
                            resolve();
                        }).catch(err=>reject(err));
                    }).catch(err=>reject(err));
                }),{
                    pending: 'Updating list...',
                    success: 'List updated successfully',
                    error: errorToast('Failed to update list')
                });
            }
        }}
    };

    const resetState = () => {
        methods.clearErrors();
        setConfirmDelete(false);
        setConfirmDelete(false);
        setSlugHint('');
        setRunSQL('');
        if (!selectedList){
            ['LIST_ID','LIST_NAME','LIST_DESCRIPTION','LIST_TYPE','LIST_SLUG','PROTECTED','LIST_DATA'].forEach(k=>methods.setValue(k,''));
        }
    }
    const cancelList = () => {
        setSelectedList('');
        setIsNewList(false);
        setRunSQL('');
        resetState();
    }
    
    useEffect(()=>{
        methods.clearErrors();
        if (!listdetails.data) return;
        Object.keys(listdetails.data).forEach(k=>methods.setValue(k,listdetails.data[k]));
    },[listdetails.data]);
    useEffect(()=>{
        if (selectedList) {
            setIsNewList(false);
            resetState();
            listdetails.refetch();
        }
    },[selectedList]);
    return (
        <>
            <section>
                <header className="mb-4">
                    <Helmet>
                        <title>{t('admin.lists.title')}</title>
                    </Helmet>
                    <Row>
                        <Col>
                            <h2>{t('admin.lists.title')} <AppButton format="add-list" onClick={newList}>Add New</AppButton></h2>
                        </Col>
                    </Row>
                </header>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Lists:</Form.Label>
                    <Col xs="auto">
                        {lists.isLoading && <Loading>Loading Lists...</Loading>}
                        {lists.isError && <Loading isError>Failed to load lists</Loading>}
                        {lists.data &&
                            <Form.Control as="select" id="lists" value={selectedList} onChange={e=>setSelectedList(e.target.value)}>
                                <option></option>
                                {lists.data.map(l=><option key={l.LIST_ID} value={l.LIST_ID}>{l.LIST_NAME}</option>)}
                            </Form.Control>
                        }
                    </Col>
                </Form.Group>
            </section>
            <section className="border-top mt-4 pt-3">
                {listdetails.isLoading && <Loading type="alert">Loading List Details..</Loading>}
                {listdetails.isError && <Loading type="alert" isError>Error loading list details</Loading>}
                {(listdetails.data||isNewList) && 
                    <FormProvider {...methods}>
                        <Form onSubmit={methods.handleSubmit(saveList)} onReset={cancelList}>
                            <ListDetails locked={listdetails.data?.PROTECTED} handleBlur={handleBlur} slugHint={slugHint} pickSlugHint={pickSlugHint} handleDeleteList={handleDeleteList} isNewList={isNewList} setRunSQL={setRunSQL}/>
                        </Form>
                    </FormProvider>
                }
            </section>
            {runSQL!='' && <ListRunSQL runSQL={runSQL}/>}
            <ModalConfirm show={confirmSave} title="Save?" buttons={confirmSaveButtons}>Are you sure you want to save this list?</ModalConfirm>
            <ModalConfirm show={confirmDelete} title="Delete?" buttons={confirmDeleteButtons}>Are you sure you want to delete this list?</ModalConfirm>
        </>
    );
}

function ListDetails({locked,handleBlur,slugHint,pickSlugHint,handleDeleteList,isNewList,setRunSQL}) {
    const [allowUpload,setAllowUpload] = useState(false);
    
    const { control, getValues, formState: { errors }} = useFormContext();
    const watchListType = useWatch({name:'LIST_TYPE'});
    const tabIndent = e => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const t = e.target;
            t.setRangeText('  ',t.selectionStart,t.selectionEnd,'end');
        }
    }
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List ID:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="LIST_ID"
                        defaultValue='new'
                        control={control}
                        render={({field})=><Form.Control {...field} plaintext readOnly/>}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List Name*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="LIST_NAME"
                        defaultValue=''
                        rules={{required:{value:true,message:'You must enter a List Name'}}}
                        control={control}
                        render={({field})=><Form.Control {...field} type="text" onBlur={e=>{field.onBlur(e);handleBlur(e);}} disabled={locked=="1"} isInvalid={errors.LIST_NAME}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.LIST_NAME?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List Description:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="LIST_DESCRIPTION"
                        defaultValue=''
                        control={control}
                        render={({field})=>{
                            if (locked=="1") return <p className="m-0 py-2">{field.value}</p>;
                            else return <Form.Control {...field} type="text" disabled={locked=="1"}/>;
                        }}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List Type*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="LIST_TYPE"
                        defaultValue=''
                        rules={{required:{value:true,message:'You must enter a List Type'}}}
                        control={control}
                        render={({field})=>{
                            if (locked=="1") return <p className="m-0 py-2">{field.value}</p>;
                            else return (
                                <ToggleButtonGroup {...field} type="radio" className={errors.LIST_TYPE&&'is-invalid'}>
                                    <ToggleButton type="radio" id="listType-JSON" value="json">JSON</ToggleButton>
                                    <ToggleButton type="radio" id="listType-List" value="list">List</ToggleButton>
                                    <ToggleButton type="radio" id="listType-SQL" value="sql">SQL</ToggleButton>
                                </ToggleButtonGroup>
                            );
                        }}
                    />
                    <Form.Control.Feedback type="invalid">{errors.LIST_TYPE?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List Slug:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="LIST_SLUG"
                        defaultValue=''
                        control={control}
                        render={({field})=><Form.Control {...field} type="text" onBlur={e=>{field.onBlur(e);handleBlur(e);}} disabled={locked=="1"} isInvalid={errors.LIST_SLUG}/>}
                    />
                    {slugHint && <Form.Text className="text-muted">Suggested Slug: <span className="slugHint" onClick={pickSlugHint}>{slugHint}</span></Form.Text>}
                    <Form.Control.Feedback type="invalid">{errors.LIST_SLUG?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>List Data:</Form.Label>
                <Col md={9}>
                    {(watchListType=='list'&&allowUpload)&&<AppButton format="upload" size="sm">Upload Data</AppButton>}
                    <Controller
                        name="LIST_DATA"
                        defaultValue=''
                        control={control}
                        render={({field})=><Form.Control {...field} id="listData-editor" spellCheck="false" as="textarea" rows={8} onKeyDown={tabIndent} isInvalid={errors.LIST_DATA}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.LIST_DATA?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Row>
                <Col className="button-group">
                    <AppButton format="save" type="submit" disabled={!!Object.keys(errors).length}>Save</AppButton>
                    {(locked!="1"&&!isNewList) && <AppButton format="delete" onClick={handleDeleteList}>Delete</AppButton>}
                    {(watchListType=='sql'&&!isNewList) && <AppButton format="run" onClick={()=>setRunSQL(getValues('LIST_SLUG'))}>Run SQL</AppButton>}
                    <AppButton format="cancel" variant="secondary" type="reset">Cancel</AppButton>
                </Col>
            </Row>
        </>
    );
}

function ListRunSQL({runSQL}) {
    const { getListData } = useListsQueries();
    const results = getListData(runSQL);
    return (
        <section className="border-top mt-4 pt-3">
            <header>
                <Row>
                    <Col><h3>SQL Results</h3></Col>
                </Row>
            </header>
            <article>
                {results.data && 
                    <Row className="mb-2">
                        <Col><em>Displaying First 20 Records</em></Col>
                    </Row>
                }
                <Row>
                    <Col>
                        {results.isLoading&&<p>Loading...</p>}
                        {results.isError&&<p>Error Loading</p>}
                        {results.data && <pre>{JSON.stringify(results.data.slice(0,19),null,2)}</pre>}
                    </Col>
                </Row>
            </article>
        </section>
    );
}
