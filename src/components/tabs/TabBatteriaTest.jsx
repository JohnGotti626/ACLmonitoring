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
import { createTestObject, saveTestToSupabase } from '../../utils/testUtils';

export default function TabBatteriaTest({ patient, activePhase, onChangePhase, onSaveTest }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // State Modal Nuova Valutazione Clinica
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  // Sub-Tab Superiori a Sinistra (Default: CMJ Bilaterale)
  const [activeSubTab, setActiveSubTab] = useState('CMJ_BILATERAL'); // 'LSI', 'FORZA', 'CMJ_BILATERAL', 'CMJ_SL', 'DJ_BILATERAL', 'DJ_SL'

  // Mapper fase riabilitativa -> chiave fase per la Batteria Test
  const getPhaseKeyForBatteria = (fase) => {
    if (!fase) return 'Fase 3 (>80%)';
    const str = String(fase).toLowerCase();
    if (str.includes('1') || str.includes('early') || str.includes('rom')) return 'Fase 1';
    if (str.includes('2') || str.includes('mid') || str.includes('forza')) return 'Fase 2 (>70%)';
    if (str.includes('3') || str.includes('run') || str.includes('power') || str.includes('drills')) return 'Fase 3 (>80%)';
    if (str.includes('4') || str.includes('late') || str.includes('cod') || str.includes('agility')) return 'Fase 4';
    if (str.includes('5') || str.includes('perf') || str.includes('rts') || str.includes('sport') || str.includes('play')) return 'Fase 5 (RTS)';
    return 'Fase 3 (>80%)';
  };

  // Fase Target Selezionata a Destra (Sincronizzata di default con la Fase Attiva del paziente)
  const [selectedPhase, setSelectedPhase] = useState(() => getPhaseKeyForBatteria(patient?.fase_riabilitativa || activePhase));

  // Sincronizzazione automatica quando viene cambiata la fase nelle Direttive Operative
  React.useEffect(() => {
    const currentActive = patient?.fase_riabilitativa || activePhase;
    if (currentActive) {
      setSelectedPhase(getPhaseKeyForBatteria(currentActive));
    }
  }, [patient?.fase_riabilitativa, activePhase]);

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

  // STORICO TEST REGISTRATI NEL TEMPO (filtrati rigorosamente per il paziente attivo)
  const [testsHistory, setTestsHistory] = useState(patient?.tests || []);
  const [selectedTestId, setSelectedTestId] = useState(
    patient?.tests && patient.tests.length > 0 ? patient.tests[patient.tests.length - 1].id : null
  );

  // Sincronizzazione dinamica quando cambia il paziente o i suoi test
  React.useEffect(() => {
    const currentTests = Array.isArray(patient?.tests) ? patient.tests : [];
    setTestsHistory(currentTests);
    if (currentTests.length > 0) {
      setSelectedTestId(currentTests[currentTests.length - 1].id);
    } else {
      setSelectedTestId(null);
    }
  }, [patient?.id, patient?.tests]);

  const activeTest = testsHistory.find(t => t.id === selectedTestId) || (testsHistory.length > 0 ? testsHistory[testsHistory.length - 1] : null);

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

  if (!activeTest) {
    cupsData = [];
  } else if (currentPhase.isEarlyStage) {
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

  // Gestore salvataggio o modifica test da Modal
  const handleModalSave = async (newValData) => {
    const targetId = newValData.id || editingTest?.id;
    const isEditing = !!targetId;

    if (isEditing) {
      const updated = testsHistory.map((existingTest) => {
        if (existingTest.id === targetId) {
          const parseLSI = (val) => (val !== null && val !== undefined && val !== '' ? parseFloat(val) : null);
          const lsiQuadCalc = parseLSI(newValData.lsi_quad_calculated);
          const lsiFlexCalc = parseLSI(newValData.lsi_curl_calculated);

          const updatedTest = {
            ...existingTest,
            patient_id: patient?.id || existingTest.patient_id,
            patientId: patient?.id || existingTest.patientId,
            date: newValData.data_valutazione ? newValData.data_valutazione.split('-').reverse().join('/') : existingTest.date,
            lsiQuad: lsiQuadCalc !== null ? lsiQuadCalc : existingTest.lsiQuad,
            lsiFlex: lsiFlexCalc !== null ? lsiFlexCalc : existingTest.lsiFlex,
            quadSano: newValData.iso_leg_ext_sx !== null ? newValData.iso_leg_ext_sx : existingTest.quadSano,
            quadOp: newValData.iso_leg_ext_dx !== null ? newValData.iso_leg_ext_dx : existingTest.quadOp,
            flexSano: newValData.iso_leg_curl_sx !== null ? newValData.iso_leg_curl_sx : existingTest.flexSano,
            flexOp: newValData.iso_leg_curl_dx !== null ? newValData.iso_leg_curl_dx : existingTest.flexOp,
            calfRaiseSX: newValData.calf_raise_sx !== null ? newValData.calf_raise_sx : existingTest.calfRaiseSX,
            calfRaiseDX: newValData.calf_raise_dx !== null ? newValData.calf_raise_dx : existingTest.calfRaiseDX,
            soleoSX: newValData.soleo_sx !== null ? newValData.soleo_sx : existingTest.soleoSX,
            soleoDX: newValData.soleo_dx !== null ? newValData.soleo_dx : existingTest.soleoDX,
            bulgarianSX: newValData.bulgarian_sx !== null ? newValData.bulgarian_sx : existingTest.bulgarianSX,
            bulgarianDX: newValData.bulgarian_dx !== null ? newValData.bulgarian_dx : existingTest.bulgarianDX,
            imtpForce: newValData.imtp_peak_force !== null ? newValData.imtp_peak_force : existingTest.imtpForce,
            jumpHeight: newValData.jump_height_cm !== null ? newValData.jump_height_cm : existingTest.jumpHeight,
            contractionTime: newValData.contraction_time_ms !== null ? newValData.contraction_time_ms : existingTest.contractionTime,
            peakPower: newValData.peak_power_w !== null ? newValData.peak_power_w : existingTest.peakPower,
            rsiCmj: newValData.rsi_cmj !== null ? newValData.rsi_cmj : existingTest.rsiCmj,
            eccBrakingSX: newValData.ecc_braking_sx !== null ? newValData.ecc_braking_sx : existingTest.eccBrakingSX,
            eccBrakingDX: newValData.ecc_braking_dx !== null ? newValData.ecc_braking_dx : existingTest.eccBrakingDX,
            concImpulseSX: newValData.conc_impulse_sx !== null ? newValData.conc_impulse_sx : existingTest.concImpulseSX,
            concImpulseDX: newValData.conc_impulse_dx !== null ? newValData.conc_impulse_dx : existingTest.concImpulseDX,
            slCmjHeightSX: newValData.sl_cmj_height_sx !== null ? newValData.sl_cmj_height_sx : existingTest.slCmjHeightSX,
            slCmjHeightDX: newValData.sl_cmj_height_dx !== null ? newValData.sl_cmj_height_dx : existingTest.slCmjHeightDX,
            slCmjCtSX: newValData.sl_cmj_ct_sx !== null ? newValData.sl_cmj_ct_sx : existingTest.slCmjCtSX,
            slCmjCtDX: newValData.sl_cmj_ct_dx !== null ? newValData.sl_cmj_ct_dx : existingTest.slCmjCtDX,
            slCmjPeakPowerSX: newValData.sl_cmj_peak_power_sx !== null ? newValData.sl_cmj_peak_power_sx : existingTest.slCmjPeakPowerSX,
            slCmjPeakPowerDX: newValData.sl_cmj_peak_power_dx !== null ? newValData.sl_cmj_peak_power_dx : existingTest.slCmjPeakPowerDX,
            slCmjRsiSX: newValData.sl_cmj_rsi_sx !== null ? newValData.sl_cmj_rsi_sx : existingTest.slCmjRsiSX,
            slCmjRsiDX: newValData.sl_cmj_rsi_dx !== null ? newValData.sl_cmj_rsi_dx : existingTest.slCmjRsiDX,
            slCmjEccImpulseSX: newValData.sl_cmj_ecc_impulse_sx !== null ? newValData.sl_cmj_ecc_impulse_sx : existingTest.slCmjEccImpulseSX,
            slCmjEccImpulseDX: newValData.sl_cmj_ecc_impulse_dx !== null ? newValData.sl_cmj_ecc_impulse_dx : existingTest.slCmjEccImpulseDX,
            djBoxHeight: newValData.dj_box_height || existingTest.djBoxHeight,
            djContactTime: newValData.dj_contact_time !== null ? newValData.dj_contact_time : existingTest.djContactTime,
            rsiDropJump: newValData.dj_rsi !== null ? newValData.dj_rsi : existingTest.rsiDropJump,
            djBrakingForce: newValData.dj_braking_force !== null ? newValData.dj_braking_force : existingTest.djBrakingForce,
            djBrakingImpulse: newValData.dj_braking_impulse !== null ? newValData.dj_braking_impulse : existingTest.djBrakingImpulse,
            slDjBoxHeight: newValData.sl_dj_box_height || existingTest.slDjBoxHeight,
            slDjCtSX: newValData.sl_dj_ct_sx !== null ? newValData.sl_dj_ct_sx : existingTest.slDjCtSX,
            slDjCtDX: newValData.sl_dj_ct_dx !== null ? newValData.sl_dj_ct_dx : existingTest.slDjCtDX,
            slDjRsiSX: newValData.sl_dj_rsi_sx !== null ? newValData.sl_dj_rsi_sx : existingTest.slDjRsiSX,
            slDjRsiDX: newValData.sl_dj_rsi_dx !== null ? newValData.sl_dj_rsi_dx : existingTest.slDjRsiDX,
            slDjHeightSX: newValData.sl_dj_height_sx !== null ? newValData.sl_dj_height_sx : existingTest.slDjHeightSX,
            slDjHeightDX: newValData.sl_dj_height_dx !== null ? newValData.sl_dj_height_dx : existingTest.slDjHeightDX,
            slDjBrakingSX: newValData.sl_dj_braking_sx !== null ? newValData.sl_dj_braking_sx : existingTest.slDjBrakingSX,
            slDjBrakingDX: newValData.sl_dj_braking_dx !== null ? newValData.sl_dj_braking_dx : existingTest.slDjBrakingDX,
            brakingAsym: newValData.ecc_braking_asym_calculated || existingTest.brakingAsym,
            cmjImpulseLsi: newValData.ecc_braking_asym_calculated ? (100 - parseFloat(newValData.ecc_braking_asym_calculated)).toFixed(1) : existingTest.cmjImpulseLsi,
            slCmjHeightLsi: newValData.lsi_sl_cmj_height_calculated || existingTest.slCmjHeightLsi,
            slDjRsiLsi: newValData.lsi_sl_dj_rsi_calculated || existingTest.slDjRsiLsi
          };
          console.log("Dati inviati (modifica test):", updatedTest);
          saveTestToSupabase(updatedTest);
          return updatedTest;
        }
        return existingTest;
      });

      setTestsHistory(updated);
      setSelectedTestId(targetId);
      setEditingTest(null);

      if (onSaveTest) {
        onSaveTest(updated);
      }
    } else {
      const newNum = testsHistory.length + 1;
      const newTest = createTestObject(newValData, patient?.id, newNum);

      console.log("Dati inviati:", newTest);

      await saveTestToSupabase(newTest);

      setTestsHistory(prev => [...prev, newTest]);
      setSelectedTestId(newTest.id);
      setEditingTest(null);

      if (onSaveTest) {
        onSaveTest([...testsHistory, newTest]);
      }
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
          { key: 'bulgarianDX', label: 'Bulgarian 6RM (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.bulgarianDX !== undefined ? t.bulgarianDX : '-' },
          { key: 'soleoSX', label: 'Soleo (SX)', unit: 'kg', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.soleoSX !== undefined ? t.soleoSX : '-' },
          { key: 'soleoDX', label: 'Soleo (DX)', unit: 'kg', dotColor: 'bg-pink-400', getValue: (t) => t.soleoDX !== undefined ? t.soleoDX : '-' },
          { key: 'imtpForce', label: 'IMTP Peak Force', unit: 'N', dotColor: 'bg-amber-400', getValue: (t) => t.imtpForce || '-' },
          { key: 'imtpRelForce', label: 'IMTP Peak Force / BW', unit: 'N/kg', dotColor: 'bg-amber-400', getValue: (t) => t.imtpRelForce || '-' }
        ];

      // 1. TAB [CMJ Bilaterale]
      case 'CMJ_BILATERAL':
        return [
          { key: 'jumpHeight', label: 'Altezza Salto', unit: 'cm', dotColor: 'bg-emerald-400', getValue: (t) => t.jumpHeight !== undefined ? t.jumpHeight : '-' },
          { key: 'rsiCmj', label: 'RSImod', unit: 'm/s', dotColor: 'bg-emerald-400', getValue: (t) => t.rsiCmj ? t.rsiCmj : (t.jumpHeight && t.contractionTime ? ((t.jumpHeight / 100) / (t.contractionTime / 1000)).toFixed(2) : '-') },
          { key: 'contractionTime', label: 'Contraction Time', unit: 'ms', dotColor: 'bg-amber-400', getValue: (t) => t.contractionTime !== undefined ? t.contractionTime : '-' },
          { key: 'peakPower', label: 'Peak Power', unit: 'W', dotColor: 'bg-emerald-400', getValue: (t) => t.peakPower !== undefined ? t.peakPower : '-' },
          { key: 'eccBrakingSX', label: 'Eccentric Impulse Left', unit: 'N·s', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.eccBrakingSX !== undefined ? t.eccBrakingSX : '-' },
          { key: 'eccBrakingDX', label: 'Eccentric Impulse Right', unit: 'N·s', dotColor: 'bg-pink-400', getValue: (t) => t.eccBrakingDX !== undefined ? t.eccBrakingDX : '-' },
          { key: 'concImpulseSX', label: 'Concentric Impulse Left', unit: 'N·s', dotColor: 'bg-[#00e5ff]', getValue: (t) => t.concImpulseSX !== undefined ? t.concImpulseSX : '-' },
          { key: 'concImpulseDX', label: 'Concentric Impulse Right', unit: 'N·s', dotColor: 'bg-pink-400', getValue: (t) => t.concImpulseDX !== undefined ? t.concImpulseDX : '-' }
        ];

      // 2. TAB [CMJ Monopodalico]
      case 'CMJ_SL':
        return [
          { 
            key: 'slCmjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-cyan-400',
            getValue: (t) => (t.slCmjHeightSX !== undefined && t.slCmjHeightDX !== undefined) ? `${t.slCmjHeightSX} / ${t.slCmjHeightDX}` : 'N/D',
            getTooltip: (t) => (t.slCmjHeightSX !== undefined && t.slCmjHeightDX !== undefined) ? ({ title: 'Altezza Salto SL (SX vs DX)', sx: `${t.slCmjHeightSX} cm`, dx: `${t.slCmjHeightDX} cm`, asym: `LSI: ${((Math.min(t.slCmjHeightSX, t.slCmjHeightDX)/Math.max(t.slCmjHeightSX, t.slCmjHeightDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slCmjCtSplit', 
            label: 'Duration Time (SX / DX)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400',
            getValue: (t) => (t.slCmjCtSX !== undefined && t.slCmjCtDX !== undefined) ? `${t.slCmjCtSX} / ${t.slCmjCtDX}` : 'N/D',
            getTooltip: (t) => (t.slCmjCtSX !== undefined && t.slCmjCtDX !== undefined) ? ({ title: 'Duration Time SL (SX vs DX)', sx: `${t.slCmjCtSX} ms`, dx: `${t.slCmjCtDX} ms`, asym: `LSI: ${((Math.min(t.slCmjCtSX, t.slCmjCtDX)/Math.max(t.slCmjCtSX, t.slCmjCtDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slCmjPeakPowerSplit', 
            label: 'Peak Power/BW (SX / DX)', 
            unit: 'W/kg', 
            dotColor: 'bg-[#00e5ff]',
            getValue: (t) => (t.slCmjPeakPowerSX !== undefined && t.slCmjPeakPowerDX !== undefined) ? `${t.slCmjPeakPowerSX} / ${t.slCmjPeakPowerDX}` : 'N/D',
            getTooltip: (t) => (t.slCmjPeakPowerSX !== undefined && t.slCmjPeakPowerDX !== undefined) ? ({ title: 'Peak Power/BW (SX vs DX)', sx: `${t.slCmjPeakPowerSX} W/kg`, dx: `${t.slCmjPeakPowerDX} W/kg`, asym: `LSI: ${((Math.min(t.slCmjPeakPowerSX, t.slCmjPeakPowerDX)/Math.max(t.slCmjPeakPowerSX, t.slCmjPeakPowerDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slCmjRsiSplit', 
            label: 'RSI (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => (t.slCmjRsiSX !== undefined && t.slCmjRsiDX !== undefined) ? `${t.slCmjRsiSX} / ${t.slCmjRsiDX}` : 'N/D',
            getTooltip: (t) => (t.slCmjRsiSX !== undefined && t.slCmjRsiDX !== undefined) ? ({ title: 'RSI Monopodalico (SX vs DX)', sx: `${t.slCmjRsiSX} m/s`, dx: `${t.slCmjRsiDX} m/s`, asym: `LSI: ${((Math.min(t.slCmjRsiSX, t.slCmjRsiDX)/Math.max(t.slCmjRsiSX, t.slCmjRsiDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slCmjEccImpulseSplit', 
            label: 'Braking Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-purple-400',
            getValue: (t) => (t.slCmjEccImpulseSX !== undefined && t.slCmjEccImpulseDX !== undefined) ? `${t.slCmjEccImpulseSX} / ${t.slCmjEccImpulseDX}` : 'N/D',
            getTooltip: (t) => (t.slCmjEccImpulseSX !== undefined && t.slCmjEccImpulseDX !== undefined) ? ({ title: 'Braking Impulse (SX vs DX)', sx: `${t.slCmjEccImpulseSX} N·s`, dx: `${t.slCmjEccImpulseDX} N·s`, asym: `LSI: ${((Math.min(t.slCmjEccImpulseSX, t.slCmjEccImpulseDX)/Math.max(t.slCmjEccImpulseSX, t.slCmjEccImpulseDX))*100).toFixed(1)}%` }) : null
          }
        ];

      // 3. TAB [Drop Jump Bilaterale - RTP Specialist Metriche Temporali & Dual Load Cells]
      case 'DJ_BILATERAL':
        return [
          { 
            key: 'djBoxHeight', 
            label: 'Altezza Caduta Box Selector', 
            unit: '-', 
            dotColor: 'bg-amber-400', 
            getValue: (t) => t.djBoxHeight || '30 cm' 
          },
          { 
            key: 'djJumpHeight', 
            label: 'Altezza Salto (cm)', 
            unit: 'cm', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djJumpHeight !== undefined && t.djJumpHeight !== null ? `${t.djJumpHeight} cm` : (t.jumpHeight !== undefined ? `${t.jumpHeight} cm` : 'N/D') 
          },
          { 
            key: 'djContactTime', 
            label: 'Ground Contact Time GCT (<250ms)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400', 
            getValue: (t) => t.djContactTime !== undefined && t.djContactTime !== null ? `${t.djContactTime} ms` : 'N/D' 
          },
          { 
            key: 'rsiDropJump', 
            label: '1. Efficienza Pliometrica RSI (>2.0)', 
            unit: 'idx', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.rsiDropJump !== undefined && t.rsiDropJump !== null ? `${t.rsiDropJump} idx` : 'N/D' 
          },
          { 
            key: 'djTtpfMs', 
            label: '2. Time to Peak Force TTPF (80-120ms)', 
            unit: 'ms', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => t.djTtpfMs !== undefined && t.djTtpfMs !== null ? `${t.djTtpfMs} ms` : 'N/D' 
          },
          { 
            key: 'djTakeoffAsymMs', 
            label: '3. Asimmetria Temporale Stacco (<10ms)', 
            unit: 'ms', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djTakeoffAsymMs !== undefined && t.djTakeoffAsymMs !== null ? `${t.djTakeoffAsymMs} ms` : 'N/D' 
          },
          { 
            key: 'djLandingPeakLsi', 
            label: 'Landing Peak Force LSI (>=90%)', 
            unit: '%', 
            dotColor: 'bg-pink-400', 
            getValue: (t) => t.djLandingPeakLsi !== undefined && t.djLandingPeakLsi !== null ? `${t.djLandingPeakLsi}%` : (t.djLandingPeakSX && t.djLandingPeakDX ? `${((Math.min(t.djLandingPeakSX, t.djLandingPeakDX)/Math.max(t.djLandingPeakSX, t.djLandingPeakDX))*100).toFixed(1)}%` : 'N/D') 
          },
          { 
            key: 'djConcImpulseLsi', 
            label: 'Concentric Impulse LSI (>=95%)', 
            unit: '%', 
            dotColor: 'bg-cyan-400', 
            getValue: (t) => t.djConcImpulseLsi !== undefined && t.djConcImpulseLsi !== null ? `${t.djConcImpulseLsi}%` : (t.djConcImpulseSX && t.djConcImpulseDX ? `${((Math.min(t.djConcImpulseSX, t.djConcImpulseDX)/Math.max(t.djConcImpulseSX, t.djConcImpulseDX))*100).toFixed(1)}%` : 'N/D') 
          },
          { 
            key: 'djValidationStatus', 
            label: 'Stato Validazione Test RTP Specialist', 
            unit: '-', 
            dotColor: 'bg-emerald-400', 
            getValue: (t) => t.djValidationStatus ? (t.djValidationStatus === 'PASSED' ? '✅ PASSED' : `❌ ${t.djFailReason || 'FAILED'}`) : 'N/D' 
          }
        ];

      // 4. TAB [Drop Jump Monopodalico / SL DJ]
      case 'DJ_SL':
        return [
          { key: 'slDjBoxHeight', label: 'Altezza Caduta Box Selector', unit: 'cm', dotColor: 'bg-amber-400', getValue: (t) => t.slDjBoxHeight || '-' },
          { 
            key: 'slDjCtSplit', 
            label: 'Ground Contact Time (SX / DX)', 
            unit: 'ms', 
            dotColor: 'bg-amber-400',
            getValue: (t) => (t.slDjCtSX !== undefined && t.slDjCtDX !== undefined) ? `${t.slDjCtSX} / ${t.slDjCtDX}` : 'N/D',
            getTooltip: (t) => (t.slDjCtSX !== undefined && t.slDjCtDX !== undefined) ? ({ title: 'Ground Contact Time (SX vs DX)', sx: `${t.slDjCtSX} ms`, dx: `${t.slDjCtDX} ms`, asym: `LSI: ${((Math.min(t.slDjCtSX, t.slDjCtDX)/Math.max(t.slDjCtSX, t.slDjCtDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slDjRsiSplit', 
            label: 'RSI (SX / DX)', 
            unit: 'm/s', 
            dotColor: 'bg-emerald-400',
            getValue: (t) => (t.slDjRsiSX !== undefined && t.slDjRsiDX !== undefined) ? `${t.slDjRsiSX} / ${t.slDjRsiDX}` : 'N/D',
            getTooltip: (t) => (t.slDjRsiSX !== undefined && t.slDjRsiDX !== undefined) ? ({ title: 'SL Drop Jump RSI (SX vs DX)', sx: `${t.slDjRsiSX} m/s`, dx: `${t.slDjRsiDX} m/s`, asym: `LSI: ${((Math.min(t.slDjRsiSX, t.slDjRsiDX)/Math.max(t.slDjRsiSX, t.slDjRsiDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slDjHeightSplit', 
            label: 'Altezza Salto (SX / DX)', 
            unit: 'cm', 
            dotColor: 'bg-[#00e5ff]',
            getValue: (t) => (t.slDjHeightSX !== undefined && t.slDjHeightDX !== undefined) ? `${t.slDjHeightSX} / ${t.slDjHeightDX}` : 'N/D',
            getTooltip: (t) => (t.slDjHeightSX !== undefined && t.slDjHeightDX !== undefined) ? ({ title: 'SL Drop Jump Altezza (SX vs DX)', sx: `${t.slDjHeightSX} cm`, dx: `${t.slDjHeightDX} cm`, asym: `LSI: ${((Math.min(t.slDjHeightSX, t.slDjHeightDX)/Math.max(t.slDjHeightSX, t.slDjHeightDX))*100).toFixed(1)}%` }) : null
          },
          { 
            key: 'slDjBrakingSplit', 
            label: 'Braking Impulse (SX / DX)', 
            unit: 'N·s', 
            dotColor: 'bg-purple-400',
            getValue: (t) => (t.slDjBrakingSX !== undefined && t.slDjBrakingDX !== undefined) ? `${t.slDjBrakingSX} / ${t.slDjBrakingDX}` : 'N/D',
            getTooltip: (t) => (t.slDjBrakingSX !== undefined && t.slDjBrakingDX !== undefined) ? ({ title: 'SL Drop Jump Braking Impulse', sx: `${t.slDjBrakingSX} N·s`, dx: `${t.slDjBrakingDX} N·s`, asym: `LSI: ${((Math.min(t.slDjBrakingSX, t.slDjBrakingDX)/Math.max(t.slDjBrakingSX, t.slDjBrakingDX))*100).toFixed(1)}%` }) : null
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTest && (
              <button
                onClick={() => {
                  setEditingTest(activeTest);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 border border-cyan-500/40 transition-all cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modifica {activeTest.label}</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingTest(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/50 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#39FF14]" />
              <span>+ Nuova Valutazione</span>
            </button>
          </div>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTestId(t.id);
                            setEditingTest(t);
                            setIsModalOpen(true);
                          }}
                          title={`Modifica ${t.label}`}
                          className="p-1 hover:bg-cyan-900/60 rounded transition-colors text-slate-400 hover:text-cyan-300"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                        </button>
                      </div>
                      <div className="text-[9.5px] text-cyan-400 font-mono font-bold mt-0.5">{t.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50 text-xs font-semibold">
              {testsHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium bg-[#050c17]/50">
                    <div className="space-y-2 max-w-sm mx-auto">
                      <Activity className="w-8 h-8 text-cyan-500/40 mx-auto" />
                      <p className="text-sm font-extrabold text-white">Nessuna valutazione registrata per {patient?.nome} {patient?.cognome}</p>
                      <p className="text-xs text-slate-400">Clicca sul pulsante in alto <strong className="text-cyan-400 font-bold">"+ Nuova Valutazione"</strong> per inserire i dati del primo test clinico.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
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
              ))
              )}
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingTest(null);
        }}
        patient={patient}
        initialData={editingTest}
        onSaveEvaluation={handleModalSave}
      />

    </div>
  );
}
