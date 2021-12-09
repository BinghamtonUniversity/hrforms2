import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";
import { useAppQueries } from "../../queries";

export default function Information({posTypes}) {
    const {control,setValue,formState:{errors}} = useFormContext();
    const watchPosType = useWatch({name:'posType.id',control:control});
    const watchReqType = useWatch({name:'reqType.id',control:control});
    
    const { getListData } = useAppQueries();
    const reqtypes = getListData('reqTypes',{cacheTime:600000,staleTime:600000,
        select:d=>d.filter(r=>posTypes[watchPosType]?.reqTypes.includes(r[0]))
    });

    const handlePosTypeChange = (field,e) => {
        field.onChange(e);
        setValue('posType.title',posTypes[e.target.value].title);
    }
    const handleReqTypeChange = (field,e) => {
        field.onChange(e);
        const rt = reqtypes.data.find(a=>a[0]==e.target.value);
        setValue('reqType.title',(rt)?rt[1]:'');
    }
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Position Type*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="posType.id"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'You must select a Position Type'}}}
                        render={({field})=>Object.keys(posTypes).map(k=><Form.Check key={k} {...field} inline type="radio" label={posTypes[k].title} value={k} checked={k==field.value} onChange={e=>handlePosTypeChange(field,e)}/>) }
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Request Type*:</Form.Label>
                <Col sm={9} md={6} lg={5} xl={4}>
                    <Controller
                        name="reqType.id"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Request Type is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleReqTypeChange(field,e)} isInvalid={errors.reqType}>
                                <option></option>
                                {reqtypes.data && reqtypes.data.map(r=><option key={r[0]} value={r[0]}>{r[0]} - {r[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.reqType?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Effective Date*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="effDate"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Effective Date is required'}}}
                        render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={errors.effDate}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Candidate Name <span className="font-italic">(if known)</span>:</Form.Label>
                <Col md={7} lg={6} xl={5}>
                    <Controller
                        name="candidateName"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Candidate Name"/>}
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
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter B-Number"/>}
                    />
                </Col>
            </Form.Group>
            {(watchReqType!='EX' && watchReqType!='FS') &&
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Brief Job Description:</Form.Label>
                    <Col md={9}>
                        <Controller
                            name="jobDesc"
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief job description" rows={5}/>}
                        />
                    </Col>
                </Form.Group>
            }
        </>
    );
}
