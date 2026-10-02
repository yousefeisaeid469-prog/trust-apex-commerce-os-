import {fraudRisk as classify,fraudScore} from '../../platform/autonomous-commerce-fabric/core';
import type {FraudInput,RiskLevel} from '../../platform/autonomous-commerce-fabric/contracts';
export type FraudSignal=FraudInput;
export function score(input:FraudSignal){return fraudScore(input);}
export function risk(input:FraudSignal):RiskLevel{return classify(input);}
export function explain(input:FraudSignal){const scoreValue=fraudScore(input);return {score:scoreValue,risk:classify(input),signals:{velocity:input.velocity,returnRate:input.returnRate,deviceRisk:input.deviceRisk,paymentMismatch:input.paymentMismatch,shippingMismatch:input.shippingMismatch,accountAgeDays:input.accountAgeDays}};}
