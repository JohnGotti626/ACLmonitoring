import React, { useState } from 'react';
import { 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Activity, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Dumbbell,
  Package,
  CheckSquare,
  Check,
  Box
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ModalNuovaValutazione from '../ModalNuovaValutazione';
import GraficoMultimetrica from '../GraficoMultimetrica';

export default function TabBatteriaTest({ patient, activePhase, onChangePhase, onSaveTest }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // State Modal Nuova Valutazione Clinica
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sub-Tab Superiori a Sinistra (Default: CMJ Bilaterale)
  const [activeSubTab, setActiveSubTab] = useState('CMJ_BILATERAL'); // 'LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL', 'DJ_SL'

  // Fase Target Selezionata a Destra (Default: Fase 3 (>80%))
  const [selectedPhase, setSelectedPhase] = useState('Fase 3 (>80%)');

  // CHECKLIST QUALITATIVA FASE 2
  const [phase2Checklist, setPhase2Checklist] = useState({
    extensionComplete: true, 
    noEffusion: true,        
    singleLegSquat: true,    
    pogoJump: false,         
    landingStrategies: true  
  });

  // CHECKLIST QUALITATIVA FASE 3
  const [phase3Checklist, setPhase3Checklist] = useState({
    runningCurriculum: true,   
    treadmillMechanics: true,  
    noEffusionPostLoad: true   
  });

  // CHECKLIST QUALITATIVA FASE 4
  const [phase4Checklist, setPhase4Checklist] = useState({
    slDropJumpBox30: true,     
    firstFieldTech: true,      
    weeklyLoadTolerance: true  
  });

  // STORICO TEST REGISTRATI NEL TEMPO (Simulazione 6 valutazioni longitudinali al 9° mese)
  const [testsHistory, setTestsHistory] = useState([
    {
      id: 'test-1',
      num: 1,
      label: 'Test #1 (Mese 2)',
      date: '15/02/2026',
      lsiQuad: 62.5,
      lsiQuadDelta: '-',
      lsiFlex: 68.0,
      lsiFlexDelta: '-',
      lsiSingleHop: 60.0,
      lsiSingleHopDelta: '-',
      lsiTripleHop: 62.0,
      lsiTripleHopDelta: '-',
      quadOpNmKg: 1.85,
      quadSano: 360,
      quadOp: 225,
      flexSano: 180,
      flexOp: 122,
      bulgarianSX: 30,
      bulgarianDX: 24,
      soleoSX: 28,
      soleoDX: 22,
      imtpForce: '-',
      imtpRelForce: '-',
      ikdc: 58,
      brakingAsym: 19.5,
      cmjImpulseLsi: 68.5,
      slCmjHeightLsi: 72.0,
      rsiCmj: 0.32,
      calfRaiseKg: 35.0,
      jumpHeight: 21.0,
      contractionTime: 680,
      peakPower: 35.2,
      eccBrakingSX: 165,
      eccBrakingDX: 140,
      eccBrakingAsym: '17.8',
      concImpulseSX: 160,
      concImpulseDX: 135,
      concImpulseAsym: '18.5',
      slCmjHeightSX: 12.5,
      slCmjHeightDX: 9.0,
      slCmjCtSX: 640,
      slCmjCtDX: 690,
      slCmjPeakPowerSX: 24.0,
      slCmjPeakPowerDX: 17.5,
      slCmjRsiSX: 0.20,
      slCmjRsiDX: 0.14,
      slCmjEccImpulseSX: 105,
      slCmjEccImpulseDX: 78,
      djBoxHeight: '30 cm',
      djContactTime: 260,
      rsiDropJump: 1.10,
      djBrakingForce: 1250,
      djBrakingImpulse: 150,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 410,
      slDjCtDX: 460,
      slDjRsiSX: 0.28,
      slDjRsiDX: 0.21,
      slDjHeightSX: 10.5,
      slDjHeightDX: 8.0,
      slDjBrakingSX: 85,
      slDjBrakingDX: 65,
      slDjRsiLsi: 75.0,
      aclrsi: 45
    },
    {
      id: 'test-2',
      num: 2,
      label: 'Test #2 (Mese 3.5)',
      date: '30/03/2026',
      lsiQuad: 72.4,
      lsiQuadDelta: '+15.8%',
      lsiFlex: 75.5,
      lsiFlexDelta: '+11.0%',
      lsiSingleHop: 73.9,
      lsiSingleHopDelta: '+23.1%',
      lsiTripleHop: 74.8,
      lsiTripleHopDelta: '+20.6%',
      quadOpNmKg: 2.15,
      quadSano: 393,
      quadOp: 284,
      flexSano: 185,
      flexOp: 140,
      bulgarianSX: 38,
      bulgarianDX: 32,
      soleoSX: 32,
      soleoDX: 28,
      imtpForce: '-',
      imtpRelForce: '-',
      ikdc: 68,
      brakingAsym: 16.1,
      cmjImpulseLsi: 73.9,
      slCmjHeightLsi: 82.6,
      rsiCmj: 0.43,
      calfRaiseKg: 42.0,
      jumpHeight: 26.5,
      contractionTime: 650,
      peakPower: 41.8,
      eccBrakingSX: 195,
      eccBrakingDX: 168,
      eccBrakingAsym: '16.1',
      concImpulseSX: 185,
      concImpulseDX: 155,
      concImpulseAsym: '16.2',
      slCmjHeightSX: 15.5,
      slCmjHeightDX: 12.8,
      slCmjCtSX: 620,
      slCmjCtDX: 650,
      slCmjPeakPowerSX: 28.5,
      slCmjPeakPowerDX: 23.4,
      slCmjRsiSX: 0.25,
      slCmjRsiDX: 0.20,
      slCmjEccImpulseSX: 120,
      slCmjEccImpulseDX: 98,
      djBoxHeight: '30 cm',
      djContactTime: 240,
      rsiDropJump: 1.25,
      djBrakingForce: 1380,
      djBrakingImpulse: 175,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 380,
      slDjCtDX: 420,
      slDjRsiSX: 0.34,
      slDjRsiDX: 0.28,
      slDjHeightSX: 12.5,
      slDjHeightDX: 10.2,
      slDjBrakingSX: 95,
      slDjBrakingDX: 78,
      slDjRsiLsi: 82.4,
      aclrsi: 62
    },
    {
      id: 'test-3',
      num: 3,
      label: 'Test #3 (Mese 5)',
      date: '15/05/2026',
      lsiQuad: 81.5,
      lsiQuadDelta: '+12.6%',
      lsiFlex: 83.0,
      lsiFlexDelta: '+9.9%',
      lsiSingleHop: 80.5,
      lsiSingleHopDelta: '+8.9%',
      lsiTripleHop: 82.0,
      lsiTripleHopDelta: '+9.6%',
      quadOpNmKg: 2.45,
      quadSano: 420,
      quadOp: 342,
      flexSano: 200,
      flexOp: 166,
      bulgarianSX: 42,
      bulgarianDX: 38,
      soleoSX: 35,
      soleoDX: 32,
      imtpForce: '-',
      imtpRelForce: '-',
      ikdc: 76,
      brakingAsym: 11.2,
      cmjImpulseLsi: 82.5,
      slCmjHeightLsi: 87.0,
      rsiCmj: 0.50,
      calfRaiseKg: 48.0,
      jumpHeight: 31.0,
      contractionTime: 610,
      peakPower: 46.5,
      eccBrakingSX: 220,
      eccBrakingDX: 198,
      eccBrakingAsym: '11.2',
      concImpulseSX: 210,
      concImpulseDX: 190,
      concImpulseAsym: '10.5',
      slCmjHeightSX: 17.2,
      slCmjHeightDX: 15.0,
      slCmjCtSX: 590,
      slCmjCtDX: 620,
      slCmjPeakPowerSX: 31.0,
      slCmjPeakPowerDX: 27.0,
      slCmjRsiSX: 0.29,
      slCmjRsiDX: 0.24,
      slCmjEccImpulseSX: 128,
      slCmjEccImpulseDX: 112,
      djBoxHeight: '30 cm',
      djContactTime: 220,
      rsiDropJump: 1.45,
      djBrakingForce: 1520,
      djBrakingImpulse: 192,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 340,
      slDjCtDX: 380,
      slDjRsiSX: 0.42,
      slDjRsiDX: 0.35,
      slDjHeightSX: 14.2,
      slDjHeightDX: 12.0,
      slDjBrakingSX: 110,
      slDjBrakingDX: 92,
      slDjRsiLsi: 83.3,
      aclrsi: 74
    },
    {
      id: 'test-4',
      num: 4,
      label: 'Test #4 (Mese 6.5)',
      date: '30/06/2026',
      lsiQuad: 88.5,
      lsiQuadDelta: '+8.6%',
      lsiFlex: 89.2,
      lsiFlexDelta: '+7.5%',
      lsiSingleHop: 87.5,
      lsiSingleHopDelta: '+8.7%',
      lsiTripleHop: 88.0,
      lsiTripleHopDelta: '+7.3%',
      quadOpNmKg: 2.68,
      quadSano: 435,
      quadOp: 385,
      flexSano: 210,
      flexOp: 187,
      bulgarianSX: 46,
      bulgarianDX: 43,
      soleoSX: 38,
      soleoDX: 36,
      imtpForce: '2450',
      imtpRelForce: '32.5',
      ikdc: 84,
      brakingAsym: 7.5,
      cmjImpulseLsi: 88.0,
      slCmjHeightLsi: 91.5,
      rsiCmj: 0.58,
      calfRaiseKg: 52.0,
      jumpHeight: 34.5,
      contractionTime: 590,
      peakPower: 51.0,
      eccBrakingSX: 242,
      eccBrakingDX: 225,
      eccBrakingAsym: '7.5',
      concImpulseSX: 230,
      concImpulseDX: 215,
      concImpulseAsym: '6.9',
      slCmjHeightSX: 18.5,
      slCmjHeightDX: 16.9,
      slCmjCtSX: 560,
      slCmjCtDX: 585,
      slCmjPeakPowerSX: 33.2,
      slCmjPeakPowerDX: 30.4,
      slCmjRsiSX: 0.33,
      slCmjRsiDX: 0.29,
      slCmjEccImpulseSX: 138,
      slCmjEccImpulseDX: 127,
      djBoxHeight: '30 cm',
      djContactTime: 205,
      rsiDropJump: 1.68,
      djBrakingForce: 1650,
      djBrakingImpulse: 210,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 310,
      slDjCtDX: 340,
      slDjRsiSX: 0.48,
      slDjRsiDX: 0.42,
      slDjHeightSX: 15.8,
      slDjHeightDX: 14.1,
      slDjBrakingSX: 122,
      slDjBrakingDX: 110,
      slDjRsiLsi: 87.5,
      aclrsi: 82
    },
    {
      id: 'test-5',
      num: 5,
      label: 'Test #5 (Mese 8)',
      date: '15/08/2026',
      lsiQuad: 94.2,
      lsiQuadDelta: '+6.4%',
      lsiFlex: 93.8,
      lsiFlexDelta: '+5.2%',
      lsiSingleHop: 93.5,
      lsiSingleHopDelta: '+6.8%',
      lsiTripleHop: 94.0,
      lsiTripleHopDelta: '+6.8%',
      quadOpNmKg: 2.88,
      quadSano: 450,
      quadOp: 424,
      flexSano: 220,
      flexOp: 206,
      bulgarianSX: 50,
      bulgarianDX: 48,
      soleoSX: 42,
      soleoDX: 40,
      imtpForce: '2680',
      imtpRelForce: '35.7',
      ikdc: 91,
      brakingAsym: 4.0,
      cmjImpulseLsi: 94.0,
      slCmjHeightLsi: 95.2,
      rsiCmj: 0.65,
      calfRaiseKg: 58.0,
      jumpHeight: 37.2,
      contractionTime: 570,
      peakPower: 55.4,
      eccBrakingSX: 258,
      eccBrakingDX: 248,
      eccBrakingAsym: '4.0',
      concImpulseSX: 245,
      concImpulseDX: 236,
      concImpulseAsym: '3.8',
      slCmjHeightSX: 19.8,
      slCmjHeightDX: 18.8,
      slCmjCtSX: 540,
      slCmjCtDX: 560,
      slCmjPeakPowerSX: 35.8,
      slCmjPeakPowerDX: 34.1,
      slCmjRsiSX: 0.37,
      slCmjRsiDX: 0.34,
      slCmjEccImpulseSX: 146,
      slCmjEccImpulseDX: 139,
      djBoxHeight: '30 cm',
      djContactTime: 190,
      rsiDropJump: 1.95,
      djBrakingForce: 1780,
      djBrakingImpulse: 228,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 285,
      slDjCtDX: 305,
      slDjRsiSX: 0.55,
      slDjRsiDX: 0.50,
      slDjHeightSX: 17.2,
      slDjHeightDX: 15.9,
      slDjBrakingSX: 135,
      slDjBrakingDX: 126,
      slDjRsiLsi: 90.9,
      aclrsi: 90
    },
    {
      id: 'test-6',
      num: 6,
      label: 'Test #6 (Mese 9)',
      date: '15/09/2026',
      lsiQuad: 97.8,
      lsiQuadDelta: '+3.8%',
      lsiFlex: 96.5,
      lsiFlexDelta: '+2.9%',
      lsiSingleHop: 96.8,
      lsiSingleHopDelta: '+3.5%',
      lsiTripleHop: 97.2,
      lsiTripleHopDelta: '+3.4%',
      quadOpNmKg: 3.05,
      quadSano: 462,
      quadOp: 452,
      flexSano: 225,
      flexOp: 217,
      bulgarianSX: 54,
      bulgarianDX: 52,
      soleoSX: 45,
      soleoDX: 44,
      imtpForce: '2820',
      imtpRelForce: '37.6',
      ikdc: 96,
      brakingAsym: 1.9,
      cmjImpulseLsi: 97.5,
      slCmjHeightLsi: 97.0,
      rsiCmj: 0.72,
      calfRaiseKg: 62.0,
      jumpHeight: 39.5,
      contractionTime: 550,
      peakPower: 58.8,
      eccBrakingSX: 270,
      eccBrakingDX: 265,
      eccBrakingAsym: '1.9',
      concImpulseSX: 256,
      concImpulseDX: 251,
      concImpulseAsym: '2.0',
      slCmjHeightSX: 20.8,
      slCmjHeightDX: 20.2,
      slCmjCtSX: 520,
      slCmjCtDX: 535,
      slCmjPeakPowerSX: 37.5,
      slCmjPeakPowerDX: 36.4,
      slCmjRsiSX: 0.40,
      slCmjRsiDX: 0.38,
      slCmjEccImpulseSX: 154,
      slCmjEccImpulseDX: 149,
      djBoxHeight: '30 cm',
      djContactTime: 180,
      rsiDropJump: 2.18,
      djBrakingForce: 1890,
      djBrakingImpulse: 242,
      slDjBoxHeight: '30 cm',
      slDjCtSX: 265,
      slDjCtDX: 280,
      slDjRsiSX: 0.62,
      slDjRsiDX: 0.58,
      slDjHeightSX: 18.5,
      slDjHeightDX: 17.5,
      slDjBrakingSX: 145,
      slDjBrakingDX: 138,
      slDjRsiLsi: 93.5,
      aclrsi: 95
    }
  ]);

  // TEST SELEZIONATO PER I BICCHIERI (Default: Test #6 al 9° Mese)
  const [selectedTestId, setSelectedTestId] = useState('test-6');
  const activeTest = testsHistory.find(t => t.id === selectedTestId) || testsHistory[testsHistory.length - 1];

  // CONFIGURAZIONE CLINICA FASI & TARGET
  const phaseConfig = {
    'Fase 1': { 
      name: '🔴 FASE 1: Early Stage (ROM & AMI)', 
      isEarlyStage: true 
    },
    'Fase 2 (>70%)': { 
      name: '🟡 FASE 2: Mid Stage (Qualità & Landing)', 
      isPhase2: true
    },
    'Fase 3 (>80%)': { 
      name: '🟢 FASE 3: Return to Run & Decel', 
      isPhase3: true
    },
    'Fase 4': { 
      name: '🔵 FASE 4: Late Stage (ASPETAR Pliometria & Potenza)', 
      isPhase4: true
    },
    'Fase 5 (RTS)': { 
      name: '🌟 FASE 5: Return to Performance (Match Play)', 
      targetLSIQuad: 95, 
      targetQuadNmKg: 3.0, 
      targetLSIHam: 95, 
      targetRSI: 2.0 
    }
  };

  const currentPhase = phaseConfig[selectedPhase] || phaseConfig['Fase 3 (>80%)'];

  // CONFIGURAZIONE BICCHIERI PRESTATIVI
  let cupsData = [];

  if (currentPhase.isEarlyStage) {
    cupsData = [
      {
        id: 'early_stage_info',
        title: 'FASE 1: PRE-TEST',
        subtitle: '(ROM & Estensione 0°)',
        displayVal: '0.0° / 0°',
        targetLabel: 'Target: Estensione Completa 0°',
        percentageAchieved: 100,
        isOk: true,
        earlyNote: 'In questa prima fase il focus è sul recupero del gonfiore, ROM e controllo artrogeno. Test ad alto carico rimandati alla Fase 2.'
      }
    ];
  } else if (currentPhase.isPhase2) {
    const hqRatio = activeTest.quadOp ? (activeTest.flexOp / activeTest.quadOp) : 0.63;
    const ikdcVal = activeTest.ikdc || 68;

    cupsData = [
      {
        id: 'lsi_quad',
        title: 'LSI QUADRICIPITE',
        subtitle: '(ISO Push Leg Ext...)',
        value: activeTest.lsiQuad,
        displayVal: `${activeTest.lsiQuad.toFixed(1)}%`,
        targetLabel: 'Target: >70%',
        percentageAchieved: Math.round((activeTest.lsiQuad / 70) * 100),
        isOk: activeTest.lsiQuad >= 70
      },
      {
        id: 'quad_rel_op',
        title: 'FORZA REL. QUAD OP',
        subtitle: '(Nm/kg Peso Corporeo)',
        value: activeTest.quadOpNmKg,
        displayVal: `${activeTest.quadOpNmKg.toFixed(2)} Nm/kg`,
        targetLabel: 'Target: >2.0 Nm/kg',
        percentageAchieved: Math.round((activeTest.quadOpNmKg / 2.0) * 100),
        isOk: activeTest.quadOpNmKg >= 2.0
      },
      {
        id: 'lsi_flex',
        title: 'LSI HAMSTRING',
        subtitle: '(ISO Push Leg Curl...)',
        value: activeTest.lsiFlex,
        displayVal: `${activeTest.lsiFlex.toFixed(1)}%`,
        targetLabel: 'Target: >70%',
        percentageAchieved: Math.round((activeTest.lsiFlex / 70) * 100),
        isOk: activeTest.lsiFlex >= 70
      },
      {
        id: 'hq_ratio',
        title: 'H/Q RATIO ISOMETRICO',
        subtitle: '(Flex OP / Quad OP)',
        value: hqRatio,
        displayVal: `${hqRatio.toFixed(2)}`,
        targetLabel: 'Target: >0.55',
        percentageAchieved: Math.round((hqRatio / 0.55) * 100),
        isOk: hqRatio >= 0.55
      },
      {
        id: 'ikdc_score',
        title: 'SCORE IKDC',
        subtitle: '(Prontitudine Clinica)',
        value: ikdcVal,
        displayVal: `${ikdcVal}/100`,
        targetLabel: 'Target: >64/100',
        percentageAchieved: Math.round((ikdcVal / 64) * 100),
        isOk: ikdcVal >= 64
      }
    ];
  } else if (currentPhase.isPhase3) {
    cupsData = [
      {
        id: 'lsi_quad_3',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: activeTest.lsiQuad,
        displayVal: `${activeTest.lsiQuad.toFixed(1)}%`,
        targetLabel: 'Target: >80%',
        percentageAchieved: Math.round((activeTest.lsiQuad / 80) * 100),
        isOk: activeTest.lsiQuad >= 80
      },
      {
        id: 'lsi_ham_3',
        title: 'LSI HAMSTRING',
        subtitle: '(Iso Push Leg Curl)',
        value: activeTest.lsiFlex,
        displayVal: `${activeTest.lsiFlex.toFixed(1)}%`,
        targetLabel: 'Target: >80%',
        percentageAchieved: Math.round((activeTest.lsiFlex / 80) * 100),
        isOk: activeTest.lsiFlex >= 80
      },
      {
        id: 'cmj_braking_3',
        title: 'LSI BRAKING IMPULSE',
        subtitle: '(CMJ Braking Imp)',
        value: activeTest.cmjImpulseLsi || 82.5,
        displayVal: `${(activeTest.cmjImpulseLsi || 82.5).toFixed(1)}%`,
        targetLabel: 'Target: >80%',
        percentageAchieved: Math.round(((activeTest.cmjImpulseLsi || 82.5) / 80) * 100),
        isOk: (activeTest.cmjImpulseLsi || 82.5) >= 80
      },
      {
        id: 'lsi_height_3',
        title: 'SL CMJ HEIGHT LSI',
        subtitle: '(Single Leg Jump)',
        value: activeTest.slCmjHeightLsi || 87.0,
        displayVal: `${(activeTest.slCmjHeightLsi || 87.0).toFixed(1)}%`,
        targetLabel: 'Target: >80%',
        percentageAchieved: Math.round(((activeTest.slCmjHeightLsi || 87.0) / 80) * 100),
        isOk: (activeTest.slCmjHeightLsi || 87.0) >= 80
      },
      {
        id: 'rsi_dj_3',
        title: 'DL DROP JUMP RSI',
        subtitle: '(Double Leg Box)',
        value: activeTest.rsiDropJump || 1.55,
        displayVal: `${(activeTest.rsiDropJump || 1.55).toFixed(2)} idx`,
        targetLabel: 'Target: >1.20 idx',
        percentageAchieved: Math.round(((activeTest.rsiDropJump || 1.55) / 1.20) * 100),
        isOk: (activeTest.rsiDropJump || 1.55) >= 1.20
      }
    ];
  } else if (currentPhase.isPhase4) {
    const eccAsymVal = activeTest.eccBrakingAsym !== undefined ? parseFloat(activeTest.eccBrakingAsym) : (activeTest.brakingAsym || 11.2);
    const cmjAsymLsi = 100 - eccAsymVal;

    cupsData = [
      {
        id: 'lsi_quad_p4',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: activeTest.lsiQuad,
        displayVal: `${activeTest.lsiQuad.toFixed(1)}%`,
        targetLabel: 'Target: >85%',
        percentageAchieved: Math.round((activeTest.lsiQuad / 85) * 100),
        isOk: activeTest.lsiQuad >= 85
      },
      {
        id: 'lsi_ham_p4',
        title: 'LSI HAMSTRING',
        subtitle: '(Iso Push Leg Curl)',
        value: activeTest.lsiFlex,
        displayVal: `${activeTest.lsiFlex.toFixed(1)}%`,
        targetLabel: 'Target: >85%',
        percentageAchieved: Math.round((activeTest.lsiFlex / 85) * 100),
        isOk: activeTest.lsiFlex >= 85
      },
      {
        id: 'cmj_braking_p4',
        title: 'LSI BRAKING IMPULSE',
        subtitle: '(CMJ Braking Imp)',
        value: cmjAsymLsi,
        displayVal: `${cmjAsymLsi.toFixed(1)}% LSI`,
        targetLabel: 'Target: >85%',
        percentageAchieved: Math.round((cmjAsymLsi / 85) * 100),
        isOk: eccAsymVal <= 15
      },
      {
        id: 'sl_cmj_p4',
        title: 'SL CMJ HEIGHT LSI',
        subtitle: '(Single Leg Jump)',
        value: activeTest.slCmjHeightLsi || 87.0,
        displayVal: `${(activeTest.slCmjHeightLsi || 87.0).toFixed(1)}%`,
        targetLabel: 'Target: >85%',
        percentageAchieved: Math.round(((activeTest.slCmjHeightLsi || 87.0) / 85) * 100),
        isOk: (activeTest.slCmjHeightLsi || 87.0) >= 85
      },
      {
        id: 'dl_dj_p4',
        title: 'DL DROP JUMP RSI',
        subtitle: '(Double Leg Box)',
        value: activeTest.rsiDropJump || 1.55,
        displayVal: `${(activeTest.rsiDropJump || 1.55).toFixed(2)} idx`,
        targetLabel: 'Target: >1.30 idx',
        percentageAchieved: Math.round(((activeTest.rsiDropJump || 1.55) / 1.30) * 100),
        isOk: (activeTest.rsiDropJump || 1.55) >= 1.30
      },
      {
        id: 'aclrsi_p4',
        title: 'SCORE ACL-RSI',
        subtitle: '(Prontitudine Psico)',
        value: activeTest.aclrsi || 85,
        displayVal: `${activeTest.aclrsi || 85}/100`,
        targetLabel: 'Target: >65/100',
        percentageAchieved: Math.round(((activeTest.aclrsi || 85) / 65) * 100),
        isOk: (activeTest.aclrsi || 85) >= 65
      }
    ];
  } else {
    cupsData = [
      {
        id: 'lsi_quad',
        title: 'LSI QUADRICIPITE',
        subtitle: '(Iso Push Leg Ext)',
        value: activeTest.lsiQuad,
        displayVal: `${activeTest.lsiQuad.toFixed(1)}%`,
        targetLabel: `Target: >${currentPhase.targetLSIQuad}%`,
        percentageAchieved: Math.round((activeTest.lsiQuad / currentPhase.targetLSIQuad) * 100),
        isOk: activeTest.lsiQuad >= currentPhase.targetLSIQuad
      },
      {
        id: 'quad_nm_kg',
        title: 'FORZA RELATIVA QUAD',
        subtitle: '(Nm/kg peso corporeo)',
        value: activeTest.quadOpNmKg,
        displayVal: `${activeTest.quadOpNmKg.toFixed(2)} Nm/kg`,
        targetLabel: `Target: >${currentPhase.targetQuadNmKg} Nm/kg`,
        percentageAchieved: Math.round((activeTest.quadOpNmKg / currentPhase.targetQuadNmKg) * 100),
        isOk: activeTest.quadOpNmKg >= currentPhase.targetQuadNmKg
      },
      {
        id: 'rsi_drop_jump',
        title: 'RSI DROP JUMP',
        subtitle: '(Contact Time <250ms)',
        value: activeTest.rsiDropJump,
        displayVal: `${activeTest.rsiDropJump.toFixed(2)} rsi`,
        targetLabel: `Target: >${currentPhase.targetRSI} rsi`,
        percentageAchieved: Math.round((activeTest.rsiDropJump / currentPhase.targetRSI) * 100),
        isOk: activeTest.rsiDropJump >= currentPhase.targetRSI
      }
    ];
  }

  // Gestore aggiunta nuovo test da Modal
  const handleModalSave = (newValData) => {
    const newNum = testsHistory.length + 1;
    const newTest = {
      id: `test-${newNum}`,
      num: newNum,
      label: `Test #${newNum}`,
      date: newValData.data_valutazione ? newValData.data_valutazione.split('-').reverse().join('/') : 'Oggi',
      lsiQuad: newValData.lsi_quad_calculated ? parseFloat(newValData.lsi_quad_calculated) : 92.0,
      lsiQuadDelta: '+4.5%',
      lsiFlex: newValData.lsi_curl_calculated ? parseFloat(newValData.lsi_curl_calculated) : 90.0,
      lsiFlexDelta: '+3.5%',
      lsiSingleHop: 91.0,
      lsiSingleHopDelta: '+4.0%',
      lsiTripleHop: 92.0,
      lsiTripleHopDelta: '+4.2%',
      quadOpNmKg: 2.65,
      quadSano: newValData.iso_leg_ext_sx || 450,
      quadOp: newValData.iso_leg_ext_dx || 414,
      flexSano: newValData.iso_leg_curl_sx || 220,
      flexOp: newValData.iso_leg_curl_dx || 198,
      bulgarianSX: 44,
      bulgarianDX: 40,
      soleoSX: 36,
      soleoDX: 34,
      imtpForce: '-',
      imtpRelForce: '-',
      ikdc: 82,
      brakingAsym: newValData.ecc_braking_asym_calculated || '8.6',
      cmjImpulseLsi: newValData.ecc_braking_asym_calculated ? (100 - parseFloat(newValData.ecc_braking_asym_calculated)).toFixed(1) : 91.4,
      slCmjHeightLsi: newValData.lsi_sl_cmj_height_calculated || 90.0,
      slDjRsi: 0.45,
      slDjCt: 0.28,
      rsiCmj: newValData.rsi_cmj || 0.52,
      calfRaiseKg: 54.0,
      jumpHeight: newValData.jump_height_cm || 32.0,
      contractionTime: newValData.contraction_time_ms || 610,
      peakPower: newValData.peak_power_w || 52.5,
      eccBrakingSX: newValData.ecc_braking_sx || 240,
      eccBrakingDX: newValData.ecc_braking_dx || 220,
      eccBrakingAsym: newValData.ecc_braking_asym_calculated || '8.3',
      concImpulseSX: newValData.conc_impulse_sx || 230,
      concImpulseDX: newValData.conc_impulse_dx || 215,
      concImpulseAsym: newValData.conc_impulse_asym_calculated || '6.5',
      // CMJ Monopodalico
      slCmjHeightSX: newValData.sl_cmj_height_sx || 18.5,
      slCmjHeightDX: newValData.sl_cmj_height_dx || 16.8,
      slCmjCtSX: newValData.sl_cmj_ct_sx || 580,
      slCmjCtDX: newValData.sl_cmj_ct_dx || 610,
      slCmjPeakPowerSX: newValData.sl_cmj_peak_power_sx || 32.5,
      slCmjPeakPowerDX: newValData.sl_cmj_peak_power_dx || 29.8,
      slCmjRsiSX: newValData.sl_cmj_rsi_sx || 0.31,
      slCmjRsiDX: newValData.sl_cmj_rsi_dx || 0.27,
      slCmjEccImpulseSX: newValData.sl_cmj_ecc_impulse_sx || 132,
      slCmjEccImpulseDX: newValData.sl_cmj_ecc_impulse_dx || 120,
      // DJ Bilaterale
      djBoxHeight: newValData.dj_box_height || '30 cm',
      djContactTime: newValData.dj_contact_time || 210,
      rsiDropJump: newValData.dj_rsi || 1.65,
      djBrakingForce: newValData.dj_braking_force || 1620,
      djBrakingImpulse: newValData.dj_braking_impulse || 205,
      // SL DJ Monopodalico
      slDjBoxHeight: newValData.sl_dj_box_height || '30 cm',
      slDjCtSX: newValData.sl_dj_ct_sx || 320,
      slDjCtDX: newValData.sl_dj_ct_dx || 360,
      slDjRsiSX: newValData.sl_dj_rsi_sx || 0.45,
      slDjRsiDX: newValData.sl_dj_rsi_dx || 0.38,
      slDjHeightSX: newValData.sl_dj_height_sx || 15.0,
      slDjHeightDX: newValData.sl_dj_height_dx || 12.8,
      slDjBrakingSX: newValData.sl_dj_braking_sx || 118,
      slDjBrakingDX: newValData.sl_dj_braking_dx || 102,
      slDjRsiLsi: newValData.lsi_sl_dj_rsi_calculated || 90.0,
      aclrsi: 90
    };

    const updated = [...testsHistory, newTest];
    setTestsHistory(updated);
    setSelectedTestId(newTest.id);

    if (onSaveTest) {
      onSaveTest(newValData);
    }
  };

  // REQUISITI 1, 2, 3, 4: SOTTO-TAB PER TUTTE LE PRESTAZIONI DI SALTO
  const getSubTabRows = () => {
    switch (activeSubTab) {
      case 'LSI':
        return [
          { key: 'lsiQuad', deltaKey: 'lsiQuadDelta', label: 'LSI Quadricipite Iso Push', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiFlex', deltaKey: 'lsiFlexDelta', label: 'LSI Ischiocrurali Leg Curl', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiSingleHop', deltaKey: 'lsiSingleHopDelta', label: 'LSI Single Hop Test', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'lsiTripleHop', deltaKey: 'lsiTripleHopDelta', label: 'LSI Triple Hop Test', unit: '%', dotColor: 'bg-emerald-400' },
          { key: 'aclrsi', label: 'Score ACL-RSI Psicometrico', unit: 'pts', dotColor: 'bg-cyan-400' }
        ];
      case 'FORZA':
        return [
          { key: 'quadSano', label: 'Iso Push Leg Ext (SX)', unit: 'N', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.quadSano !== undefined ? t.quadSano : 393 },
          { key: 'quadOp', label: 'Iso Push Leg Ext (DX)', unit: 'N', dotColor: 'bg-pink-400', getValue: (t) => t.quadOp !== undefined ? t.quadOp : 543 },
          { key: 'flexSano', label: 'Iso Push Leg Curl (SX)', unit: 'N', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.flexSano !== undefined ? t.flexSano : 185 },
          { key: 'flexOp', label: 'Iso Push Leg Curl (DX)', unit: 'N', dotColor: 'bg-pink-400', getValue: (t) => t.flexOp !== undefined ? t.flexOp : 245 },
          { key: 'bulgarianSX', label: 'Bulgarian 6RM (SX)', unit: 'kg', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.bulgarianSX !== undefined ? t.bulgarianSX : 38 },
          { key: 'bulgarianDX', label: 'Bulgarian 6RM (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.bulgarianDX !== undefined ? t.bulgarianDX : 48 },
          { key: 'soleoSX', label: 'Soleo (SX)', unit: 'kg', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.soleoSX !== undefined ? t.soleoSX : 32 },
          { key: 'soleoDX', label: 'Soleo (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.soleoDX !== undefined ? t.soleoDX : 38 },
          { key: 'imtpForce', label: 'IMTP Peak Force', unit: 'N', dotColor: 'bg-amber-400', getValue: (t) => t.imtpForce || '-' },
          { key: 'imtpRelForce', label: 'IMTP Peak Force / BW', unit: 'N/kg', dotColor: 'bg-amber-400', getValue: (t) => t.imtpRelForce || '-' }
        ];

      // 1. TAB [CMJ Bilaterale]
      case 'CMJ_BILATERAL':
        return [
          { key: 'jumpHeight', label: 'Altezza Salto', unit: 'cm', dotColor: 'bg-emerald-400', getValue: (t) => t.jumpHeight !== undefined ? t.jumpHeight : 32.5 },
          { key: 'rsiCmj', label: 'RSImod', unit: 'm/s', dotColor: 'bg-emerald-400', getValue: (t) => t.rsiCmj ? t.rsiCmj : ((t.jumpHeight / 100) / (t.contractionTime / 1000)).toFixed(2) },
          { key: 'contractionTime', label: 'Contraction Time', unit: 'ms', dotColor: 'bg-amber-400', getValue: (t) => t.contractionTime !== undefined ? t.contractionTime : 610 },
          { key: 'peakPower', label: 'Peak Power', unit: 'W', dotColor: 'bg-emerald-400', getValue: (t) => t.peakPower !== undefined ? t.peakPower : 49.2 },
          { key: 'eccBrakingSX', label: 'Eccentric Impulse Left', unit: 'N·s', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.eccBrakingSX !== undefined ? t.eccBrakingSX : 235 },
          { key: 'eccBrakingDX', label: 'Eccentric Impulse Right', unit: 'N·s', dotColor: 'bg-pink-400', getValue: (t) => t.eccBrakingDX !== undefined ? t.eccBrakingDX : 205 },
          { key: 'concImpulseSX', label: 'Concentric Impulse Left', unit: 'N·s', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.concImpulseSX !== undefined ? t.concImpulseSX : 225 },
          { key: 'concImpulseDX', label: 'Concentric Impulse Right', unit: 'N·s', dotColor: 'bg-pink-400', getValue: (t) => t.concImpulseDX !== undefined ? t.concImpulseDX : 200 }
        ];

      // 2. TAB [CMJ Monopodalico]
      case 'CMJ_SL':
        return [
          { 
            key: 'slCmjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-cyan-400',
            getValue: (t) => `${t.slCmjHeightSX || 17.2} / ${t.slCmjHeightDX || 15.0}`,
            getTooltip: (t) => ({ title: 'Altezza Salto SL (SX vs DX)', sx: `${t.slCmjHeightSX || 17.2} cm`, dx: `${t.slCmjHeightDX || 15.0} cm`, asym: `LSI: ${((Math.min(t.slCmjHeightSX, t.slCmjHeightDX)/Math.max(t.slCmjHeightSX, t.slCmjHeightDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slCmjCtSplit', 
            label: 'Duration Time (SX / DX)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400',
            getValue: (t) => `${t.slCmjCtSX || 590} / ${t.slCmjCtDX || 620}`,
            getTooltip: (t) => ({ title: 'Duration Time SL (SX vs DX)', sx: `${t.slCmjCtSX || 590} ms`, dx: `${t.slCmjCtDX || 620} ms`, asym: `LSI: ${((Math.min(t.slCmjCtSX, t.slCmjCtDX)/Math.max(t.slCmjCtSX, t.slCmjCtDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slCmjPeakPowerSplit', 
            label: 'Peak Power/BW (SX / DX)', 
            unit: 'W/kg', 
            dotColor: 'bg-[#00e5ff]',
            getValue: (t) => `${t.slCmjPeakPowerSX || 31.0} / ${t.slCmjPeakPowerDX || 27.0}`,
            getTooltip: (t) => ({ title: 'Peak Power/BW (SX vs DX)', sx: `${t.slCmjPeakPowerSX || 31.0} W/kg`, dx: `${t.slCmjPeakPowerDX || 27.0} W/kg`, asym: `LSI: ${((Math.min(t.slCmjPeakPowerSX, t.slCmjPeakPowerDX)/Math.max(t.slCmjPeakPowerSX, t.slCmjPeakPowerDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slCmjRsiSplit', 
            label: 'RSI (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => `${t.slCmjRsiSX || 0.29} / ${t.slCmjRsiDX || 0.24}`,
            getTooltip: (t) => ({ title: 'RSI Monopodalico (SX vs DX)', sx: `${t.slCmjRsiSX || 0.29} m/s`, dx: `${t.slCmjRsiDX || 0.24} m/s`, asym: `LSI: ${((Math.min(t.slCmjRsiSX, t.slCmjRsiDX)/Math.max(t.slCmjRsiSX, t.slCmjRsiDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slCmjEccImpulseSplit', 
            label: 'Braking Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-purple-400',
            getValue: (t) => `${t.slCmjEccImpulseSX || 128} / ${t.slCmjEccImpulseDX || 112}`,
            getTooltip: (t) => ({ title: 'Braking Impulse (SX vs DX)', sx: `${t.slCmjEccImpulseSX || 128} N·s`, dx: `${t.slCmjEccImpulseDX || 112} N·s`, asym: `LSI: ${((Math.min(t.slCmjEccImpulseSX, t.slCmjEccImpulseDX)/Math.max(t.slCmjEccImpulseSX, t.slCmjEccImpulseDX))*100).toFixed(1)}%` })
          }
        ];

      // 3. TAB [Drop Jump Bilaterale]
      case 'DJ_BILATERAL':
        return [
          { key: 'djBoxHeight', label: 'Altezza Caduta Box Selector', unit: 'cm', dotColor: 'bg-amber-400', getValue: (t) => t.djBoxHeight || '30 cm' },
          { key: 'djContactTime', label: 'Ground Contact Time', unit: 'ms', dotColor: 'bg-amber-400', getValue: (t) => t.djContactTime !== undefined ? t.djContactTime : 220 },
          { key: 'rsiDropJump', label: 'RSI (Reactive Strength Index)', unit: 'm/s', dotColor: 'bg-emerald-400', getValue: (t) => t.rsiDropJump !== undefined ? t.rsiDropJump : 1.55 },
          { key: 'djBrakingForce', label: 'Mean Braking Force', unit: 'N', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.djBrakingForce !== undefined ? t.djBrakingForce : 1520 },
          { key: 'djBrakingImpulse', label: 'Braking Impulse', unit: 'N·s', dotColor: 'bg-purple-400', getValue: (t) => t.djBrakingImpulse !== undefined ? t.djBrakingImpulse : 192 }
        ];

      // 4. TAB [Drop Jump Monopodalico / SL DJ]
      case 'DJ_SL':
        return [
          { key: 'slDjBoxHeight', label: 'Altezza Caduta Box Selector', unit: 'cm', dotColor: 'bg-amber-400', getValue: (t) => t.slDjBoxHeight || '30 cm' },
          { 
            key: 'slDjCtSplit', 
            label: 'Ground Contact Time (SX / DX)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400',
            getValue: (t) => `${t.slDjCtSX || 340} / ${t.slDjCtDX || 380}`,
            getTooltip: (t) => ({ title: 'Ground Contact Time (SX vs DX)', sx: `${t.slDjCtSX || 340} ms`, dx: `${t.slDjCtDX || 380} ms`, asym: `LSI: ${((Math.min(t.slDjCtSX, t.slDjCtDX)/Math.max(t.slDjCtSX, t.slDjCtDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slDjRsiSplit', 
            label: 'RSI (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => `${t.slDjRsiSX || 0.42} / ${t.slDjRsiDX || 0.35}`,
            getTooltip: (t) => ({ title: 'SL Drop Jump RSI (SX vs DX)', sx: `${t.slDjRsiSX || 0.42} m/s`, dx: `${t.slDjRsiDX || 0.35} m/s`, asym: `LSI: ${((Math.min(t.slDjRsiSX, t.slDjRsiDX)/Math.max(t.slDjRsiSX, t.slDjRsiDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slDjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-[#00e5ff]',
            getValue: (t) => `${t.slDjHeightSX || 14.2} / ${t.slDjHeightDX || 12.0}`,
            getTooltip: (t) => ({ title: 'SL Drop Jump Altezza (SX vs DX)', sx: `${t.slDjHeightSX || 14.2} cm`, dx: `${t.slDjHeightDX || 12.0} cm`, asym: `LSI: ${((Math.min(t.slDjHeightSX, t.slDjHeightDX)/Math.max(t.slDjHeightSX, t.slDjHeightDX))*100).toFixed(1)}%` })
          },
          { 
            key: 'slDjBrakingSplit', 
            label: 'Braking Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-purple-400',
            getValue: (t) => `${t.slDjBrakingSX || 110} / ${t.slDjBrakingDX || 92}`,
            getTooltip: (t) => ({ title: 'SL Drop Jump Braking Impulse', sx: `${t.slDjBrakingSX || 110} N·s`, dx: `${t.slDjBrakingDX || 92} N·s`, asym: `LSI: ${((Math.min(t.slDjBrakingSX, t.slDjBrakingDX)/Math.max(t.slDjBrakingSX, t.slDjBrakingDX))*100).toFixed(1)}%` })
          }
        ];
      default:
        return [];
    }
  };

  const rows = getSubTabRows();

  // Helper calcolo variazione percentuale % rispetto al test precedente
  const getDeltaText = (row, currTest, tIdx) => {
    if (row.deltaKey && currTest[row.deltaKey]) return currTest[row.deltaKey];
    if (tIdx === 0) return null;
    const prevTest = testsHistory[tIdx - 1];
    const currVal = row.getRawValue ? row.getRawValue(currTest) : currTest[row.key];
    const prevVal = row.getRawValue ? row.getRawValue(prevTest) : prevTest[row.key];
    const currNum = parseFloat(currVal);
    const prevNum = parseFloat(prevVal);
    if (isNaN(currNum) || isNaN(prevNum) || prevNum === 0) return null;
    const diffPct = (((currNum - prevNum) / Math.abs(prevNum)) * 100).toFixed(1);
    return diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`;
  };

  // Checklist appropriata per la fase selezionata (Nomenclatura Sintetica 2-3 Parole)
  const currentChecklistItems = currentPhase.isPhase4 ? [
    { id: 'slDropJumpBox30', label: 'SL Drop Jump OK' },
    { id: 'firstFieldTech', label: 'Primi Gesti Campo' },
    { id: 'weeklyLoadTolerance', label: 'Tolleranza Carichi' }
  ] : currentPhase.isPhase3 ? [
    { id: 'runningCurriculum', label: 'Running 10min OK' },
    { id: 'treadmillMechanics', label: 'Corsa Treadmill' },
    { id: 'noEffusionPostLoad', label: 'No Dolore 24h' }
  ] : [
    { id: 'extensionComplete', label: 'Estensione 0° OK' },
    { id: 'noEffusion', label: 'Assenza Gonfiore' },
    { id: 'singleLegSquat', label: 'Single Leg Squat' },
    { id: 'pogoJump', label: 'Pogo Jump SL' },
    { id: 'landingStrategies', label: 'Landing OK' }
  ];

  const currentChecklistState = currentPhase.isPhase4 ? phase4Checklist : currentPhase.isPhase3 ? phase3Checklist : phase2Checklist;
  const setCurrentChecklistState = currentPhase.isPhase4 ? setPhase4Checklist : currentPhase.isPhase3 ? setPhase3Checklist : setPhase2Checklist;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none w-full items-start">
      
      {/* ========================================================================= */}
      {/* SEZIONE SINISTRA: TABELLA LONGITUDINALE (COL 8/12 - 70% LARGHEZZA) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800/90 space-y-3 shadow-2xl bg-[#0a1628] w-full flex flex-col justify-between">
        
        {/* Header Tabella Pulita */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-white text-sm tracking-wide uppercase">
                TABELLA DATI RACCOLTI PER TIPO DI TEST
              </h3>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
              Seleziona 1 tipo di test per isolare i dati assoluti e il confronto col test precedente
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/50 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#39FF14]" />
            <span>+ Nuova Valutazione</span>
          </button>
        </div>

        {/* 6 Pills Sotto-Tab (Tutte le Sezioni di Salto Sincronizzate - FLEX NOWRAP COMPATTO) */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none p-1 bg-[#050c17] rounded-xl border border-slate-800/80">
          {[
            { id: 'LSI', label: '⚡ Simmetrie & LSI (%)' },
            { id: 'FORZA', label: '🔥 Dominio della Forza' },
            { id: 'CMJ_BILATERAL', label: '📈 CMJ Bilaterale' },
            { id: 'CMJ_SL', label: '🦶 CMJ Monopodalico' },
            { id: 'DJ_BILATERAL', label: '📦 Drop Jump Bilaterale' },
            { id: 'DJ_SL', label: '⚡ SL Drop Jump' }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0f2d3a] text-cyan-300 border border-cyan-400 font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TABELLA STORICO LONGITUDINALE MULTI-SEDUTA (COMPATTA - py-1.5) */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] rounded-2xl border border-slate-800/80 bg-[#050c17]/90 shadow-inner w-full scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="sticky top-0 left-0 z-40 bg-[#0a1628] border-b border-r border-slate-800 py-2 px-3 text-slate-200 font-black min-w-[210px] w-[215px]">
                  Parametro Metrica
                </th>

                {testsHistory.map((t) => {
                  const isSelected = t.id === selectedTestId;
                  return (
                    <th 
                      key={t.id}
                      onClick={() => setSelectedTestId(t.id)}
                      className={`sticky top-0 z-30 py-2 px-2 text-center cursor-pointer transition-all border-b border-slate-800 min-w-[95px] w-[100px] ${
                        isSelected 
                          ? 'bg-cyan-950/60 text-cyan-300 font-black border-t-2 border-x border-cyan-400 shadow-lg' 
                          : 'bg-[#050c17] hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-extrabold text-xs tracking-tight">{t.label}</span>
                        <Edit3 className="w-3 h-3 text-slate-500 opacity-60 hover:opacity-100" />
                      </div>
                      <div className="text-[9.5px] text-cyan-400 font-mono font-bold mt-0.5">{t.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50 text-xs font-semibold">
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-slate-900/50 transition-colors">
                  
                  {/* Colonna 1: Parametro Metrica Sticky */}
                  <td className="sticky left-0 z-20 bg-[#0a1628] border-r border-slate-800 py-1.5 px-2.5 min-w-[210px] w-[215px] font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${row.dotColor || 'bg-emerald-400'} shrink-0 shadow-sm`}></span>
                      <span className="truncate text-xs font-bold text-white">
                        {row.label}
                        {row.unit && row.unit !== '-' && (
                          <span className="ml-1 text-slate-400 font-normal text-[10px] font-mono opacity-80">
                            ({row.unit})
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Colonne Test Registrati (min-w-[95px] w-[100px]) */}
                  {testsHistory.map((t, tIdx) => {
                    const isSelected = t.id === selectedTestId;
                    const displayVal = row.getValue ? row.getValue(t) : (t[row.key] !== undefined ? t[row.key] : '-');
                    const delta = getDeltaText(row, t, tIdx);
                    const tooltipData = row.getTooltip ? row.getTooltip(t) : null;

                    return (
                      <td 
                        key={t.id}
                        onClick={() => setSelectedTestId(t.id)}
                        className={`relative group py-1.5 px-2 text-center font-mono cursor-pointer transition-all min-w-[95px] w-[100px] ${
                          isSelected ? 'bg-cyan-950/30 font-black border-x border-cyan-500/30' : 'hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-extrabold text-xs text-white">
                            {displayVal}
                          </span>
                          {delta && (
                            <span className={`text-[8.5px] font-black font-mono px-0.5 py-0.2 rounded ${
                              delta.startsWith('+') ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/40' : 'text-red-400 bg-red-950/80 border border-red-500/40'
                            }`}>
                              {delta}
                            </span>
                          )}
                        </div>

                        {/* HOVER TOOLTIP INTERATTIVO */}
                        {tooltipData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-60 p-3 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl text-[11px] font-sans pointer-events-none text-left">
                            <div className="font-extrabold text-white text-xs border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                              <span>{tooltipData.title}</span>
                              <span className="text-[9px] font-mono text-slate-400">{t.date}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 py-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]"></span>
                                Gamba SX:
                              </span>
                              <strong className="text-[#00e5ff] font-mono">{tooltipData.sx}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 py-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                Gamba DX:
                              </span>
                              <strong className="text-pink-400 font-mono">{tooltipData.dx}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-1.5 mt-1 font-bold">
                              <span>Confronto:</span>
                              <strong className={tooltipData.isRed ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>
                                {tooltipData.asym}
                              </strong>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEZIONE DESTRA: BARRE TARGET PRESTATIVI & CHECKLIST QUALITATIVA (COL 4/12) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 glass-panel p-2.5 rounded-2xl border border-slate-800/90 space-y-2 shadow-2xl bg-[#0a1628] w-full flex flex-col justify-between">
        
        {/* Header Barre Target */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#050c17] border border-cyan-500/40 rounded-lg text-cyan-400 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xs tracking-wide uppercase">
                BARRE TARGET & PROGRESSO
              </h3>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[9px] font-black uppercase flex items-center gap-1 shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
            Target OK
          </span>
        </div>

        {/* Selezione Fase Target (Pillole Ultra-Chiare F1, F2, F3, F4, F5) */}
        <div className="space-y-1 bg-[#050c17] p-1.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[9px]">TARGET FASE:</span>
            <span className="text-emerald-400 font-black text-[10px]">{selectedPhase}</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-xs font-black">
            {[
              { key: 'Fase 1', label: 'F1' },
              { key: 'Fase 2 (>70%)', label: 'F2' },
              { key: 'Fase 3 (>80%)', label: 'F3' },
              { key: 'Fase 4', label: 'F4' },
              { key: 'Fase 5 (RTS)', label: 'F5' }
            ].map((pObj) => {
              const isActive = selectedPhase === pObj.key;
              return (
                <button
                  key={pObj.key}
                  onClick={() => {
                    setSelectedPhase(pObj.key);
                    if (onChangePhase) onChangePhase(pObj.key);
                  }}
                  className={`py-1 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-400/30 ring-1 ring-emerald-300'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {pObj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRE DI PROGRESSO ORIZZONTALI COMPATTE CON TARGET */}
        <div className="space-y-1.5 pt-0.5">
          {cupsData.map((cup) => {
            if (cup.earlyNote) {
              return (
                <div key={cup.id} className="p-2 rounded-xl bg-[#050c17] border border-amber-500/50 text-amber-300 text-[10px] font-medium space-y-1">
                  <div className="font-black text-[11px] text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cup.title} - {cup.subtitle}</span>
                  </div>
                  <p className="text-[10px]">{cup.earlyNote}</p>
                </div>
              );
            }

            const fillPct = Math.min(100, Math.max(8, cup.percentageAchieved));
            const isTargetOk = cup.isOk;

            return (
              <div 
                key={cup.id}
                className="p-1.5 px-2 rounded-xl bg-[#050c17] border border-slate-800/90 space-y-1 shadow-sm hover:border-slate-700 transition-all"
              >
                {/* Riga 1: Nome Metrica + Target di riferimento ben visibile */}
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-white font-extrabold tracking-tight">
                    {cup.title}
                  </span>
                  <span className="text-cyan-400 font-mono text-[9.5px] font-bold">
                    {cup.targetLabel}
                  </span>
                </div>

                {/* Riga 2: Barra di avanzamento orizzontale a riempimento fluido */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 h-5 bg-[#020914] rounded-md border border-slate-800 overflow-hidden p-0.5 shadow-inner">
                    {/* Riempimento fluido Ciano/Verde brillante vs Ambra */}
                    <div 
                      className={`h-full rounded relative transition-all duration-700 ease-out ${
                        isTargetOk
                          ? 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                          : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    >
                      <div className="absolute top-0 bottom-0 right-0 w-1 bg-white/80 shadow-[0_0_4px_#ffffff] rounded-r"></div>
                    </div>

                    {/* Valore % bianco ben visibile sovrapposto al centro */}
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {cup.displayVal} ({cup.percentageAchieved}%)
                    </div>
                  </div>

                  {/* Badge [TARGET OK] a destra */}
                  <div className="shrink-0">
                    {isTargetOk ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 text-[8.5px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
                        TARGET OK
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 text-[8.5px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                        IN CORSO
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* CHECKLIST QUALITATIVA (GRIGLIA VERTICALE ORDINATA 1 COLONNA CON TESTI COMPLETI) */}
        <div className="p-2.5 rounded-2xl bg-[#050c17] border border-slate-800 space-y-1.5 shadow-xl mt-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-black text-white text-[11px] uppercase tracking-wider">
                Checklist Qualitativa ({selectedPhase})
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-emerald-400 font-black bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500/40">
              {Object.values(currentChecklistState).filter(Boolean).length}/{currentChecklistItems.length} OK
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs font-bold">
            {currentChecklistItems.map((item) => {
              const isChecked = currentChecklistState[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => setCurrentChecklistState(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 font-black shadow-md ring-1 ring-emerald-500/30' 
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-extrabold whitespace-normal leading-snug">
                    {item.label} {isChecked ? '✓' : ''}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                    isChecked ? 'bg-emerald-400 border-emerald-300 text-slate-950' : 'border-slate-700 bg-slate-950'
                  }`}>
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 3: GRAFICO MULTIMETRICA INTERATTIVO (A TUTTA LARGHEZZA) */}
      {/* ========================================================================= */}
      <div className="w-full lg:col-span-12 block pt-2">
        <GraficoMultimetrica tests={testsHistory} />
      </div>

      {/* MODAL NUOVA VALUTAZIONE CLINICA LCA */}
      <ModalNuovaValutazione 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSaveEvaluation={handleModalSave}
      />

    </div>
  );
}
