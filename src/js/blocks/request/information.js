import React from "react";
import { Row, Col, Form, InputGroup, Alert } from "react-bootstrap";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { useRequestContext } from "../../config/request";
import useListsQueries from "../../queries/lists";
import { PersonPickerComponent } from "../components";
import { RequestFieldErrorMessage } from "../../pages/request";
import { get } from "lodash";

export default function Information() {
    const { control, getValues, setValue, clearErrors, formState:{ errors } } = useFormContext();
    const { posTypes, isDraft, canEdit } = useRequestContext();
    const [watchPosType,watchReqType,WatchNewFunding] = useWatch({name:['posType.id','reqType.id','newFunding.id'],control:control});
  
    const { getListData } = useListsQueries();
    const reqtypes = getListData('reqTypes',{
        select:d=>d.filter(r=>posTypes[watchPosType]?.reqTypes.includes(r[0]))
    });
    const newfundingsource = getListData('newFundingSource');

    const handlePosTypeChange = (field,e) => {
        field.onChange(e);
        clearErrors();
        setValue('posType.title',posTypes[e.target.value].title);
    }
    const handleReqTypeChange = (field,e) => {
        field.onChange(e);
        clearErrors();
        const rt = reqtypes.data.find(a=>a[0]==e.target.value);
        setValue('reqType.title',(rt)?rt[1]:'');
    }
    const handleNewFundingChange = (field,e) => {
        field.onChange(e);
        const nfs = newfundingsource.data.find(a=>a[0]==e.target.value);
        setValue('newFunding.title',(nfs)?nfs[1]:'');
    }
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${field.name}[0].label`)) {
            setValue(`${field.name}.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Position Type*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="posType.id"
                        control={control}
                        render={({field})=>Object.keys(posTypes).map(k=><Form.Check key={k} {...field} inline id={`posType-${k}`} type="radio" label={posTypes[k].title} value={k} checked={k==field.value} onChange={e=>handlePosTypeChange(field,e)} disabled={!isDraft}/>) }
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Request Type*:</Form.Label>
                <Col sm={9} md={6} lg={5} xl={4}>
                    <Controller
                        name="reqType.id"
                        control={control}
                        rules={{required:{value:true,message:'Request Type is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleReqTypeChange(field,e)} isInvalid={errors.reqType} disabled={!isDraft}>
                                <option></option>
                                {reqtypes.data && reqtypes.data.map(r=><option key={r[0]} value={r[0]}>{r[0]} - {r[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <RequestFieldErrorMessage fieldName="reqType.id"/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Effective Date*:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name="effDate"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Effective Date is required'}}}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={errors.effDate} disabled={!isDraft} autoComplete="off"/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <RequestFieldErrorMessage fieldName="effDate"/>
                </Col>
            </Form.Group>

            {watchReqType == 'N' &&
                <>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>New Position Funding*:</Form.Label>
                        <Col sm={9} md={6} lg={5} xl={4}>
                            <Controller
                                name="newFunding.id"
                                control={control}
                                rules={{required:{value:true,message:'New Position Funding is required'}}}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" onChange={e=>handleNewFundingChange(field,e)} isInvalid={errors.newFunding} disabled={!isDraft}>
                                        <option></option>
                                        {newfundingsource.data && newfundingsource.data.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}
                                    </Form.Control>
                                )}
                            />
                            <RequestFieldErrorMessage fieldName="newFunding.id"/>
                        </Col>
                    </Form.Group>
                    {['PC','PROV'].includes(WatchNewFunding) &&
                        <>
                            <Alert variant="info">
                                <Icon icon="mdi:alert" className="iconify-inline"/><strong>Attention!</strong> Be sure to enter the appropriate Department/School account number in this request.  The Budget office will transfer the funds.
                            </Alert>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>Strata Commitment ID*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name="commitmentId"
                                        defaultValue=""
                                        control={control}
                                        rules={{required:{value:true,message:'Strata Commitment ID is required'}}}
                                        render={({field}) => <Form.Control {...field} type="number" placeholder="Enter Commitment ID" isInvalid={errors.commitmentId} disabled={!canEdit}/>}
                                    />
                                    <RequestFieldErrorMessage fieldName="commitmentId"/>
                                </Col>
                            </Form.Group>
                        </>
                    }
                </>
            }

            {watchReqType == 'F' &&
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Current/Previous Employee*:</Form.Label>
                    <Col md={7} lg={6} xl={5}>
                        <Controller
                            name="currentEmployee"
                            defaultValue=""
                            rules={{validate:value=>(!!(value?.at(0)?.id&&value?.at(0)?.label)) || 'Current/Previous Employee is required'}}
                            control={control}
                            render={({field}) => <PersonPickerComponent 
                                field={field} 
                                id="current-employee" 
                                placeholder="Search for Current Employee" 
                                onBlur={e=>handleBlur(field,e)} 
                                disabled={!canEdit}
                                isInvalid={!!get(errors,field.name,false)}
                            />}
                        />
                        <RequestFieldErrorMessage fieldName="currentEmployee"/>
                    </Col>
                </Form.Group>
            }


            <Form.Group as={Row}>
                <Form.Label column md={2}>Candidate Name <span className="font-italic">(if known)</span>:</Form.Label>
                <Col md={7} lg={6} xl={5}>
                    <Controller
                        name="candidateName"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Candidate Name" disabled={!canEdit}/>}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>B-Number <span className="font-italic">(if known)</span>:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="bNumber"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter B-Number" disabled={!canEdit}/>}
                    />
                </Col>
            </Form.Group>
            {!['EX','FS'].includes(watchReqType) &&
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Brief Job Description:</Form.Label>
                    <Col md={9}>
                        <Controller
                            name="jobDesc"
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief job description" rows={5} disabled={!canEdit}/>}
                        />
                    </Col>
                </Form.Group>
            }
        </>
    );
}
