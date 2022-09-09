import React, { useEffect, useState } from "react";
import { useAppQueries } from "../../queries";
import { Row, Col, Form, InputGroup, Alert } from "react-bootstrap";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";

export default function Position() {
    const {control,getValues,setValue,posTypes,isDraft,formState:{errors}} = useFormContext();
    const [oldLineNum,setOldLineNum] = useState(getValues('lineNumber'));

    const posType = useWatch({name:'posType.id',control:control})||'';
    const isNewLine = useWatch({name:'newLine',control:control});
    const isMultiLine = useWatch({name:'multiLines',control:control});
    const watchFTE = useWatch({name:'fte',control:control})||100;

    const { getListData } = useAppQueries();
    const paybasistypes = getListData('payBasisTypes',{enabled:!!posType,
        select:d=>d.filter(p=>posTypes[posType]?.payBasisTypes.includes(p[0]))});
    const titles = getListData(posTypes[posType]?.budgetTitlesList,{enabled:!!posType});
    const appttypes = getListData('appointmentTypes',{enabled:!!posType,
        select:d=>d.filter(a=>posTypes[posType]?.apptTypes.includes(a[0])).sort()});

    const handleFTERangeChange = e => {
        setValue('fte',e.target.value);
    }
    const handlePayBasisChange = (field,e) => {
        field.onChange(e);
        const pb = paybasistypes.data.find(a=>a[0]==e.target.value);
        setValue('payBasis.title',(pb)?pb[1]:'');
    }
    const handleReqBudgetTitleChange = (field,e) => {
        field.onChange(e);
        const t = titles.data.find(a=>a[0]==e.target.value);
        setValue('reqBudgetTitle.title',(t)?t[1]:'');
    }
    const handleApptStatusChange = (field,e) => {
        field.onChange(e);
        const a = appttypes.data.find(a=>a[0]==e.target.value);
        setValue('apptStatus.title',(a)?a[1]:'');
    }

    useEffect(() => {
        if (isNewLine) {
            const linenum = getValues('lineNumber');
            setOldLineNum(linenum);
            setValue('lineNumber','');
        } else {
            setValue('lineNumber',oldLineNum);
        }
    },[isNewLine]);
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="lineNumber"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Line Number" disabled={isNewLine||!isDraft}/>}
                    />
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="newLine"
                        defaultValue={false}
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" size="lg" label="New Line" checked={field.value} disabled={!isDraft}/>}
                    />                    
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Multiple Duplicate Lines:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="multiLines"
                        defaultValue="N"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={!isDraft}/>
                                <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value=='N'} disabled={!isDraft}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            {(isMultiLine=='Y') && 
            <aside>
                <Row>
                    <Col>
                        <Alert variant="warning">All lines <strong>must</strong> have the same Title, Pay Basis, FTE, Account, and Effective Date</Alert>
                    </Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Number Of Lines:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="numLines"
                            defaultValue=""
                            control={control}
                            rules={{min:{value:2,message:'Number of Lines must be at least 2'}}}
                            render={({field}) => <Form.Control {...field} type="number" min={2} isInvalid={errors.numLines} disabled={!isDraft}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.numLines?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
            </aside>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Salary:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="minSalary"
                        defaultValue=""
                        rules={{
                            validate: v => {
                                if (v == '') return true;
                                const min = parseFloat(v)
                                if (min<=0) return 'minSalary must be greater than zero';
                                const max = getValues('maxSalary');
                                if (max == '') return true;
                                if (min > parseFloat(max)) return 'minSalary must be less than maxSalary';
                                return true;
                            },
                            deps:['maxSalary']
                        }}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" isInvalid={errors.minSalary} disabled={!isDraft}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.minSalary?.message}</Form.Control.Feedback>
                </Col>
                <Col xs="auto">
                    <Controller
                        name="maxSalary"
                        defaultValue=""
                        rules={{
                            validate: v => {
                                if (v == '') return true;
                                const max = parseFloat(v)
                                if (max<=0) return 'maxSalary must be greater than zero';
                                const min = getValues('minSalary');
                                if (min == '') return true;
                                if (max < parseFloat(min)) return 'maxSalary must be greater than minSalary';
                                return true;
                            },
                            deps:['minSalary']
                        }}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" isInvalid={errors.maxSalary} disabled={!isDraft}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.maxSalary?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>FTE:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="fte"
                        defaultValue="100"
                        control={control}
                        rules={{min:{value:1,message:'FTE cannot be less than 1%'},max:{value:100,message:'FTE cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={100} isInvalid={errors.fte} disabled={!isDraft}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.fte?.message}</Form.Control.Feedback>
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="fteRange" id="fteRange" min={1} max={100} value={watchFTE} onChange={handleFTERangeChange} disabled={!isDraft}/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Pay Basis:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="payBasis.id"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handlePayBasisChange(field,e)} disabled={!isDraft}>
                                <option></option>
                                {paybasistypes.data && paybasistypes.data.map(p=><option key={p[0]} value={p[0]}>{p[0]} - {p[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            {(posType=='C') && 
            <>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Current Salary Grade:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="currentGrade"
                            defaultValue=""
                            control={control}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter Current Salary Grade" disabled={!isDraft}/>
                                </InputGroup>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>New Salary Grade:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="newGrade"
                            defaultValue=""
                            control={control}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter New Salary Grade" disabled={!isDraft}/>
                                </InputGroup>
                            )}
                        />
                    </Col>
                </Form.Group>
            </>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Budget Title:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="reqBudgetTitle.id"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleReqBudgetTitleChange(field,e)} disabled={!isDraft}>
                                <option></option>
                                {titles.data && titles.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Status:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptStatus.id"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleApptStatusChange(field,e)} disabled={!isDraft}>
                                <option></option>
                                {appttypes.data && appttypes.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Duration:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptDuration"
                        defaultValue=""
                        rules={{min:{value:1,message:'Appointment Duration must greater than zero'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={1} isInvalid={errors.apptDuration} disabled={!isDraft}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.apptDuration?.message}</Form.Control.Feedback>
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="apptPeriod"
                        defaultValue="y"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Year(s)" value='y' checked={field.value=='y'} disabled={!isDraft}/>
                                <Form.Check {...field} inline type="radio" label="Semester(s)" value='s' checked={field.value=='s'} disabled={!isDraft}/>
                                <Form.Check {...field} inline type="radio" label="Month(s)" value='m' checked={field.value=='m'} disabled={!isDraft}/>
                                <Form.Check {...field} inline type="radio" label="Week(s)" value='w' checked={field.value=='w'} disabled={!isDraft}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Tentative End Date:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="tentativeEndDate"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} disabled={!isDraft} autoComplete="off"/>}
                    />
                </Col>
            </Form.Group>
        </>
    );
}
