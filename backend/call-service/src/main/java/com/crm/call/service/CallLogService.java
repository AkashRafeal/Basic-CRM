package com.crm.call.service;

import com.crm.call.dto.*;
import com.crm.call.model.*;
import com.crm.call.repository.CallLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CallLogService {

    private final CallLogRepository callLogRepository;

    @Transactional(readOnly = true)
    public Page<CallResponse> getCalls(
            String search,
            CallType callType,
            CallStatus status,
            CallPurpose purpose,
            CallOutcome outcome,
            RelatedEntityType relatedToType,
            Long relatedToId,
            Long assignedToUserId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        return callLogRepository.searchCalls(
                search, callType, status, purpose, outcome, relatedToType, relatedToId, assignedToUserId, fromDate, toDate, pageable
        ).map(CallResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CallResponse getCallById(Long id) {
        CallLog call = callLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call log not found with ID: " + id));
        return CallResponse.fromEntity(call);
    }

    @Transactional(readOnly = true)
    public List<CallResponse> getCallsByRelatedEntity(RelatedEntityType type, Long id) {
        return callLogRepository.findByRelatedToTypeAndRelatedToIdOrderByCreatedAtDesc(type, id)
                .stream()
                .map(CallResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CallResponse> getTodayScheduledCalls() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return callLogRepository.findByStatusAndScheduledStartTimeBetweenOrderByScheduledStartTimeAsc(
                CallStatus.SCHEDULED, startOfDay, endOfDay
        ).stream().map(CallResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public CallResponse createCall(CreateCallRequest req) {
        CallStatus status = req.getStatus() != null ? req.getStatus() :
                (req.getScheduledStartTime() != null ? CallStatus.SCHEDULED : CallStatus.COMPLETED);

        // Auto compute duration minutes if duration seconds provided
        Integer durMin = req.getDurationMinutes();
        Integer durSec = req.getDurationSeconds();
        if (durMin == null && durSec != null) {
            durMin = (int) Math.ceil((double) durSec / 60.0);
        } else if (durMin != null && durSec == null) {
            durSec = durMin * 60;
        }

        CallLog call = CallLog.builder()
                .title(req.getTitle().trim())
                .callType(req.getCallType() != null ? req.getCallType() : CallType.OUTBOUND)
                .status(status)
                .purpose(req.getPurpose() != null ? req.getPurpose() : CallPurpose.DISCOVERY)
                .outcome(req.getOutcome())
                .relatedToType(req.getRelatedToType() != null ? req.getRelatedToType() : RelatedEntityType.GENERAL)
                .relatedToId(req.getRelatedToId())
                .relatedToName(req.getRelatedToName())
                .contactName(req.getContactName())
                .contactPhone(req.getContactPhone())
                .callerPhone(req.getCallerPhone())
                .callSessionId(req.getCallSessionId() != null ? req.getCallSessionId() : ("CALL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()))
                .telephonyProvider(req.getTelephonyProvider() != null ? req.getTelephonyProvider() : "CRM_VIRTUAL_DIALER")
                .contactEmail(req.getContactEmail())
                .assignedToUserId(req.getAssignedToUserId())
                .assignedToUserName(req.getAssignedToUserName())
                .scheduledStartTime(req.getScheduledStartTime())
                .callStartTime(req.getCallStartTime() != null ? req.getCallStartTime() : (status == CallStatus.COMPLETED ? LocalDateTime.now() : null))
                .callEndTime(req.getCallEndTime())
                .durationMinutes(durMin)
                .durationSeconds(durSec)
                .agenda(req.getAgenda())
                .notes(req.getNotes())
                .actionItems(req.getActionItems())
                .recordingUrl(req.getRecordingUrl())
                .build();

        CallLog saved = callLogRepository.save(call);
        log.info("Created call log ID: {} - '{}' (from: {}, to: {})", saved.getId(), saved.getTitle(), saved.getCallerPhone(), saved.getContactPhone());
        return CallResponse.fromEntity(saved);
    }

    @Transactional
    public CallResponse initiateCall(InitiateCallRequest req) {
        String from = req.getFromNumber().trim();
        String to = req.getToNumber().trim();
        String sessionId = "CALL-SESSION-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String title = req.getTitle() != null && !req.getTitle().isBlank()
                ? req.getTitle().trim()
                : "Outbound Call to " + (req.getCustomerName() != null ? req.getCustomerName() : to);

        CallLog call = CallLog.builder()
                .title(title)
                .callType(CallType.OUTBOUND)
                .status(CallStatus.IN_PROGRESS)
                .purpose(req.getPurpose() != null ? req.getPurpose() : CallPurpose.DISCOVERY)
                .relatedToType(req.getRelatedToType() != null ? req.getRelatedToType() : RelatedEntityType.GENERAL)
                .relatedToId(req.getRelatedToId())
                .relatedToName(req.getRelatedToName() != null ? req.getRelatedToName() : req.getCustomerName())
                .contactName(req.getCustomerName())
                .contactPhone(to)
                .callerPhone(from)
                .callSessionId(sessionId)
                .telephonyProvider("CRM_VIRTUAL_DIALER")
                .contactEmail(req.getContactEmail())
                .assignedToUserId(req.getAssignedToUserId())
                .assignedToUserName(req.getAssignedToUserName())
                .callStartTime(LocalDateTime.now())
                .agenda(req.getAgenda())
                .notes(req.getNotes())
                .build();

        CallLog saved = callLogRepository.save(call);
        log.info("Initiated Outbound Call ID: {} [Session: {}] from user number {} to customer number {}",
                saved.getId(), sessionId, from, to);
        return CallResponse.fromEntity(saved);
    }

    @Transactional
    public CallResponse updateCall(Long id, UpdateCallRequest req) {
        CallLog call = callLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call log not found with ID: " + id));

        call.setTitle(req.getTitle().trim());
        if (req.getCallType() != null) call.setCallType(req.getCallType());
        if (req.getStatus() != null) call.setStatus(req.getStatus());
        if (req.getPurpose() != null) call.setPurpose(req.getPurpose());
        call.setOutcome(req.getOutcome());
        if (req.getRelatedToType() != null) call.setRelatedToType(req.getRelatedToType());
        call.setRelatedToId(req.getRelatedToId());
        call.setRelatedToName(req.getRelatedToName());
        call.setContactName(req.getContactName());
        call.setContactPhone(req.getContactPhone());
        if (req.getCallerPhone() != null) call.setCallerPhone(req.getCallerPhone());
        if (req.getCallSessionId() != null) call.setCallSessionId(req.getCallSessionId());
        if (req.getTelephonyProvider() != null) call.setTelephonyProvider(req.getTelephonyProvider());
        call.setContactEmail(req.getContactEmail());
        call.setAssignedToUserId(req.getAssignedToUserId());
        call.setAssignedToUserName(req.getAssignedToUserName());
        call.setScheduledStartTime(req.getScheduledStartTime());
        call.setCallStartTime(req.getCallStartTime());
        call.setCallEndTime(req.getCallEndTime());

        Integer durMin = req.getDurationMinutes();
        Integer durSec = req.getDurationSeconds();
        if (durMin == null && durSec != null) {
            durMin = (int) Math.ceil((double) durSec / 60.0);
        } else if (durMin != null && durSec == null) {
            durSec = durMin * 60;
        }
        call.setDurationMinutes(durMin);
        call.setDurationSeconds(durSec);

        call.setAgenda(req.getAgenda());
        call.setNotes(req.getNotes());
        call.setActionItems(req.getActionItems());
        call.setRecordingUrl(req.getRecordingUrl());

        CallLog updated = callLogRepository.save(call);
        log.info("Updated call log ID: {}", updated.getId());
        return CallResponse.fromEntity(updated);
    }

    @Transactional
    public CallResponse logCallOutcome(Long id, LogCallOutcomeRequest req) {
        CallLog call = callLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call log not found with ID: " + id));

        call.setOutcome(req.getOutcome());
        call.setStatus(req.getStatus() != null ? req.getStatus() : CallStatus.COMPLETED);

        if (req.getDurationMinutes() != null) {
            call.setDurationMinutes(req.getDurationMinutes());
            call.setDurationSeconds(req.getDurationSeconds() != null ? req.getDurationSeconds() : req.getDurationMinutes() * 60);
        } else if (req.getDurationSeconds() != null) {
            call.setDurationSeconds(req.getDurationSeconds());
            call.setDurationMinutes((int) Math.ceil((double) req.getDurationSeconds() / 60.0));
        }

        if (req.getCallStartTime() != null) call.setCallStartTime(req.getCallStartTime());
        if (req.getCallEndTime() != null) call.setCallEndTime(req.getCallEndTime());
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            call.setNotes(req.getNotes());
        }
        if (req.getActionItems() != null) call.setActionItems(req.getActionItems());
        if (req.getRecordingUrl() != null) call.setRecordingUrl(req.getRecordingUrl());

        CallLog updated = callLogRepository.save(call);
        log.info("Logged outcome for call ID: {} -> outcome: {}", id, req.getOutcome());
        return CallResponse.fromEntity(updated);
    }

    @Transactional
    public CallResponse updateStatus(Long id, CallStatus status) {
        CallLog call = callLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call log not found with ID: " + id));

        call.setStatus(status);
        if (status == CallStatus.COMPLETED && call.getCallEndTime() == null) {
            call.setCallEndTime(LocalDateTime.now());
        }
        CallLog saved = callLogRepository.save(call);
        return CallResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteCall(Long id) {
        if (!callLogRepository.existsById(id)) {
            throw new RuntimeException("Call log not found with ID: " + id);
        }
        callLogRepository.deleteById(id);
        log.info("Deleted call log ID: {}", id);
    }

    @Transactional(readOnly = true)
    public CallStatsResponse getCallStats() {
        long total = callLogRepository.count();
        long scheduled = callLogRepository.countByStatus(CallStatus.SCHEDULED);
        long inProgress = callLogRepository.countByStatus(CallStatus.IN_PROGRESS);
        long completed = callLogRepository.countByStatus(CallStatus.COMPLETED);
        long missed = callLogRepository.countByStatus(CallStatus.MISSED);
        long cancelled = callLogRepository.countByStatus(CallStatus.CANCELLED);

        long inbound = callLogRepository.countByCallType(CallType.INBOUND);
        long outbound = callLogRepository.countByCallType(CallType.OUTBOUND);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        long todayScheduled = callLogRepository.countScheduledBetween(startOfDay, endOfDay);

        long totalDurationMin = callLogRepository.sumDurationMinutes();
        double avgDuration = callLogRepository.avgDurationMinutes();

        Map<String, Long> byPurpose = new HashMap<>();
        for (Object[] row : callLogRepository.countByPurposeGroup()) {
            if (row[0] != null) {
                byPurpose.put(row[0].toString(), (Long) row[1]);
            }
        }

        Map<String, Long> byOutcome = new HashMap<>();
        long positiveOutcomes = 0;
        for (Object[] row : callLogRepository.countByOutcomeGroup()) {
            if (row[0] != null) {
                String outcomeStr = row[0].toString();
                long count = (Long) row[1];
                byOutcome.put(outcomeStr, count);
                if ("INTERESTED".equals(outcomeStr) || "MEETING_BOOKED".equals(outcomeStr) ||
                    "QUOTE_REQUESTED".equals(outcomeStr) || "DEAL_CLOSED".equals(outcomeStr) ||
                    "ISSUE_RESOLVED".equals(outcomeStr)) {
                    positiveOutcomes += count;
                }
            }
        }

        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : callLogRepository.countByStatusGroup()) {
            if (row[0] != null) {
                byStatus.put(row[0].toString(), (Long) row[1]);
            }
        }

        Map<String, Long> byType = new HashMap<>();
        for (Object[] row : callLogRepository.countByTypeGroup()) {
            if (row[0] != null) {
                byType.put(row[0].toString(), (Long) row[1]);
            }
        }

        long totalWithOutcome = byOutcome.values().stream().mapToLong(Long::longValue).sum();
        double positiveRate = totalWithOutcome > 0 ? ((double) positiveOutcomes / totalWithOutcome) * 100.0 : 0.0;

        return CallStatsResponse.builder()
                .totalCalls(total)
                .scheduledCalls(scheduled)
                .inProgressCalls(inProgress)
                .completedCalls(completed)
                .missedCalls(missed)
                .cancelledCalls(cancelled)
                .inboundCalls(inbound)
                .outboundCalls(outbound)
                .todayScheduledCalls(todayScheduled)
                .totalDurationMinutes(totalDurationMin)
                .avgDurationMinutes(Math.round(avgDuration * 10.0) / 10.0)
                .positiveOutcomeRate(Math.round(positiveRate * 10.0) / 10.0)
                .callsByPurpose(byPurpose)
                .callsByOutcome(byOutcome)
                .callsByStatus(byStatus)
                .callsByType(byType)
                .build();
    }
}
