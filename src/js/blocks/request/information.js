import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useWatch } from "react-hook-form";
import DatePicker from "react-datepicker";

export default function Information({control,errors,posTypes,reqTypes}) {
    const watchReqType = useWatch({name:'reqType',control:control});
    return (
        <article>
            <header>
                <Row>
                    <Col><h3>Information</h3></Col>
                </Row>
            </header>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Position Type*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="posType"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'You must select a Position Type'}}}
                        render={({field})=>Object.keys(posTypes).map(k=><Form.Check key={k} {...field} inline type="radio" label={posTypes[k].title} value={k} checked={k==field.value}/>) }
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Request Type*:</Form.Label>
                <Col sm={9} md={6} lg={5} xl={4}>
                    <Controller
                        name="reqType"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Request Type is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.reqType}>
                                <option></option>
                                {reqTypes.map(r=><option key={r[0]} value={r[0]}>{r[0]} - {r[1]}</option>)}
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
        </article>
    );
}
//<Form.Control as={DatePicker} selected={endDate} minDate={startDate && addDays(startDate,1)} onChange={d=>handleDateChange('end',d)} placeholderText="mm/dd/yyyy" disabled={!startDate}/>
