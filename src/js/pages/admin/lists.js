import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form, ToggleButtonGroup, ToggleButton, Button } from "react-bootstrap";
import { useAppQueries, useAdminQueries } from "../../queries";
import { Loading, AppButton } from "../../blocks/components";
import { useForm, Controller } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import camelCase from "lodash/camelCase";
import { ModalConfirm } from "../../blocks/components";

export default function AdminLists() {
    const [selectedList,setSelectedList] = useState();
    const [isNewList,setIsNewList] = useState(false);
    const [slugHint,setSlugHint] = useState('');
    const [confirmDelete,setConfirmDelete] = useState(false);
    const [confirmSave,setConfirmSave] = useState(false);

    const {getLists,getList} = useAppQueries();
    const {postList,putList,deleteList} = useAdminQueries();
    const lists = getLists();
    const listdetails = getList(selectedList,{enabled:false});
    const queryclient = useQueryClient();
    const createlist = postList();
    const updatelist = putList(selectedList);
    const deletelist = deleteList(selectedList);

    const {addToast,removeToast} = useToasts();

    const { handleSubmit, control, setValue, getValues, setError, clearErrors, trigger, formState:{errors} } = useForm({mode:'onBlur',reValidateMode:'onBlur'});
    const handleBlur = e => {
        const [listId,listSlug] = getValues(['LIST_ID','LIST_SLUG']);
        const listSlugCc = camelCase(listSlug);
        if (e.target.name == 'LIST_NAME') {
            if (listSlug == '' || listSlug != listSlugCc) {
                setValue('LIST_SLUG',camelCase(e.target.value));
                trigger('LIST_SLUG');
            }
            setSlugHint(camelCase(e.target.value));
        }
        if (e.target.name == 'LIST_SLUG') {
            if (listSlug != listSlugCc) {
                setError('LIST_SLUG',{type:'manual',message:'Invalid List Slug'});
                return false;
            }
            const chk = lists.data.find(a=>a.LIST_SLUG==listSlug)?.LIST_ID;
            if (chk && chk != listId) {
                setError('LIST_SLUG',{type:'manual',message:'List Slug already in use'});
                return false;
            }
        }
    }
    const pickSlugHint = () => setValue('LIST_SLUG',slugHint);
    const newList = () => {
        setSelectedList('');
        setIsNewList(true);
        resetState();
        setValue('LIST_ID','new');
    }
    const handleDeleteList = () => setConfirmDelete(true);
    const confirmDeleteButtons = {
        close:{title:'Cancel',callback:()=>setConfirmDelete(false)},
        confirm:{title:'Delete',variant:'danger',callback:()=>{
            setConfirmDelete(false);
            addToast(<><h5>Deleting</h5><p>deleting list...</p></>,{appearance:'info',autoDismiss:false},id=>{
                deletelist.mutateAsync(selectedList).then(()=>{
                    queryclient.refetchQueries('lists',{exact:true}).then(() => {
                        removeToast(id);
                        setSelectedList('');
                        addToast(<><h5>Success!</h5><p>List deleted successfully...</p></>,{appearance:'success'});
                    });
                }).catch(e=>{
                    removeToast(id);
                    addToast(<><h5>Error!</h5><p>Failed to delete list. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                });
            });
        }}
    };
    const saveList = data =>{
        //TODO: make this a promise and test SQL remotely
        if (data.LIST_TYPE=='json') {
            try {
                JSON.parse(data.LIST_DATA);
            } catch(e) {
                setError("LIST_DATA",{type:'manual',message:'Invalid JSON',},{shouldFocus:true});
                return false;    
            }
        }
        if (data.LIST_TYPE == 'list') {
            try {
                const list = JSON.parse(data.LIST_DATA);
                if (list.filter(l=>l.length!=2).length != 0) {
                    setError("LIST_DATA",{type:'manual',message:'Invalid List',},{shouldFocus:true});
                    return false;
                }
            } catch(e) {
                setError("LIST_DATA",{type:'manual',message:'Invalid List',},{shouldFocus:true});
                return false;    
            }
        }
        if (data.LIST_TYPE == 'sql') {
            const sql = data.LIST_DATA.toLowerCase();
            if (![';','delete','update','insert'].every(t=>!sql.includes(t))) {
                setError("LIST_DATA",{type:'manual',message:'Invalid SQL',},{shouldFocus:true});
                return false;                    
            }
        }
        setConfirmSave(true);
    }
    const confirmSaveButtons = {
        close:{title:'Cancel',callback:()=>setConfirmSave(false)},
        confirm:{title:'Save',callback:()=>{
            setConfirmSave(false);
            const data = getValues();
            if (isNewList) {
                addToast(<><h5>Creating</h5><p>Creating new list...</p></>,{appearance:'info',autoDismiss:false},id=>{
                    createlist.mutateAsync(data).then(d=>{
                        queryclient.refetchQueries('lists',{exact:true}).then(() => {
                            removeToast(id);
                            addToast(<><h5>Success!</h5><p>List created successfully...</p></>,{appearance:'success'});
                            setSelectedList(d.LIST_ID);
                        });
                    }).catch(e=>{
                        removeToast(id);
                        addToast(<><h5>Error!</h5><p>Failed to create list. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                    });
                });
            } else if (selectedList) {
                addToast(<><h5>Updating</h5><p>Updating list...</p></>,{appearance:'info',autoDismiss:false},id=>{
                    updatelist.mutateAsync(data).then(()=>{
                        Promise.all([
                            queryclient.refetchQueries('lists',{exact:true}),
                            queryclient.refetchQueries(['list',selectedList],{exact:true})
                        ]).then(() => {
                            removeToast(id);
                            addToast(<><h5>Success!</h5><p>List updated successfully...</p></>,{appearance:'success'})
                        });
                    }).catch(e=>{
                        removeToast(id);
                        addToast(<><h5>Error!</h5><p>Failed to update list. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                    });
                });
            }
        }}
    };

    const resetState = () => {
        clearErrors();
        setConfirmDelete(false);
        setConfirmDelete(false);
        setSlugHint('');
        if (!selectedList)
            ['LIST_ID','LIST_NAME','LIST_TYPE','LIST_SLUG','PROTECTED','LIST_DATA'].forEach(k=>setValue(k,''));
    }
    const cancelList = () => {
        setSelectedList('');
        setIsNewList(false);
        resetState();
    }
    
    useEffect(()=>{
        clearErrors();
        if (!listdetails.data) return;
        Object.keys(listdetails.data).forEach(k=>setValue(k,listdetails.data[k]));
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
                    <Row>
                        <Col><h2>Admin: Lists <AppButton format="add-list" onClick={newList}>Add New</AppButton></h2></Col>
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
                    <Form onSubmit={handleSubmit(saveList)} onReset={cancelList}>
                        <ListDetails control={control} errors={errors} locked={listdetails.data?.PROTECTED} handleBlur={handleBlur} slugHint={slugHint} pickSlugHint={pickSlugHint} handleDeleteList={handleDeleteList}/>
                    </Form>
                }
            </section>
            <ModalConfirm show={confirmSave} title="Save?" buttons={confirmSaveButtons}>Are you sure you want to save this list?</ModalConfirm>
            <ModalConfirm show={confirmDelete} title="Delete?" buttons={confirmDeleteButtons}>Are you sure you want to delete this list?</ModalConfirm>
        </>
    );
}

function ListDetails({control,errors,locked,handleBlur,slugHint,pickSlugHint,handleDeleteList}) {
    const tabIndent = e => {
        if (e.keyCode === 9) {
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
                <Form.Label column md={2}>List Type*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="LIST_TYPE"
                        defaultValue=''
                        rules={{required:{value:true,message:'You must enter a List Type'}}}
                        control={control}
                        render={({field})=>{
                            if (locked=="1") return <Form.Control {...field} plaintext readOnly/>;
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
                    <Button variant="primary" type="submit" disabled={!!Object.keys(errors).length}>Save</Button>
                    {(locked!="1") && <Button variant="danger" onClick={handleDeleteList}>Delete</Button>}
                    <Button variant="secondary" type="reset">Cancel</Button>
                </Col>
            </Row>
        </>
    );
}
