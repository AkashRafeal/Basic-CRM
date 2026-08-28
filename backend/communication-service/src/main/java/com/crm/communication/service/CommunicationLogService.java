package com.crm.communication.service;

import com.crm.communication.dto.*;
import com.crm.communication.model.*;
import com.crm.communication.repository.CommunicationGatewayConfigRepository;
import com.crm.communication.repository.CommunicationLogRepository;
import com.crm.communication.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationLogService {

    private final CommunicationLogRepository repository;
    private final CommunicationGatewayConfigRepository gatewayConfigRepository;
    private final JdbcTemplate jdbcTemplate;

    public static class UserScope {
        public final boolean isAdmin;
        public final boolean isManager;
        public final boolean isEmployee;
        public final Long currentUserId;
        public final List<Long> accessibleUserIds;

        public UserScope(boolean isAdmin, boolean isManager, boolean isEmployee, Long currentUserId, List<Long> accessibleUserIds) {
            this.isAdmin = isAdmin;
            this.isManager = isManager;
            this.isEmployee = isEmployee;
            this.currentUserId = currentUserId;
            this.accessibleUserIds = accessibleUserIds != null ? accessibleUserIds : Collections.emptyList();
        }

        public String getSqlInClause() {
            if (isAdmin || accessibleUserIds.isEmpty()) return "";
            return accessibleUserIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        }
    }

    public UserScope resolveScope(UserPrincipal user) {
        if (user == null) {
            return new UserScope(true, false, false, null, Collections.emptyList());
        }

        String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toUpperCase() : "EMPLOYEE";
        Long userId = user.getId();

        if ("ADMIN".equals(role)) {
            return new UserScope(true, false, false, userId, Collections.emptyList());
        } else if ("MANAGER".equals(role)) {
            List<Long> teamIds = new ArrayList<>();
            if (userId != null) {
                teamIds.add(userId);
                List<Long> memberIds = jdbcTemplate.query(
                        "SELECT id FROM crm_users WHERE manager_id = ? OR (department_id = (SELECT department_id FROM crm_users WHERE id = ?) AND department_id IS NOT NULL)",
                        (rs, rowNum) -> rs.getLong("id"),
                        userId, userId
                );
                teamIds.addAll(memberIds);
            }
            List<Long> distinctTeamIds = teamIds.stream().distinct().collect(Collectors.toList());
            return new UserScope(false, true, false, userId, distinctTeamIds);
        } else {
            List<Long> singleId = userId != null ? List.of(userId) : Collections.emptyList();
            return new UserScope(false, false, true, userId, singleId);
        }
    }

    @Transactional(readOnly = true)
    public Page<CommunicationResponse> getCommunications(
            String query,
            CommunicationChannel channel,
            CommunicationDirection direction,
            MessageStatus status,
            RelatedEntityType relatedToType,
            Boolean isStarred,
            Boolean isRead,
            UserPrincipal principal,
            Pageable pageable
    ) {
        UserScope scope = resolveScope(principal);
        return repository.searchCommunications(
                query,
                channel,
                direction,
                status,
                relatedToType,
                isStarred,
                isRead,
                scope.isAdmin,
                scope.accessibleUserIds,
                scope.isManager,
                pageable
        ).map(CommunicationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CommunicationResponse getCommunicationById(Long id) {
        CommunicationLog entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Communication log not found with ID: " + id));
        return CommunicationResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public List<CommunicationResponse> getThreadMessages(String threadId) {
        if (threadId == null || threadId.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findByThreadIdOrderByCreatedAtAsc(threadId)
                .stream()
                .map(CommunicationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunicationResponse> getCommunicationsByRelatedEntity(RelatedEntityType type, Long id) {
        return repository.findByRelatedToTypeAndRelatedToIdOrderByCreatedAtDesc(type, id)
                .stream()
                .map(CommunicationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CommunicationResponse createCommunication(CreateCommunicationRequest request) {
        String threadId = request.getThreadId();
        if (threadId == null || threadId.trim().isEmpty()) {
            threadId = "THR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        String snippet = request.getSnippet();
        if ((snippet == null || snippet.isEmpty()) && request.getBody() != null) {
            snippet = request.getBody().length() > 100
                    ? request.getBody().substring(0, 97) + "..."
                    : request.getBody();
        }

        LocalDateTime sentAt = request.getSentAt() != null ? request.getSentAt() : LocalDateTime.now();

        CommunicationLog entity = CommunicationLog.builder()
                .threadId(threadId)
                .channel(request.getChannel())
                .direction(request.getDirection() != null ? request.getDirection() : CommunicationDirection.OUTGOING)
                .status(request.getStatus() != null ? request.getStatus() : MessageStatus.SENT)
                .priority(request.getPriority() != null ? request.getPriority() : PriorityLevel.NORMAL)
                .subject(request.getSubject())
                .body(request.getBody())
                .snippet(snippet)
                .recipientName(request.getRecipientName())
                .recipientAddress(request.getRecipientAddress())
                .senderName(request.getSenderName() != null ? request.getSenderName() : "Basic CRM Agent")
                .senderAddress(request.getSenderAddress() != null ? request.getSenderAddress() : "support@crm.internal")
                .relatedToType(request.getRelatedToType() != null ? request.getRelatedToType() : RelatedEntityType.GENERAL)
                .relatedToId(request.getRelatedToId())
                .relatedToName(request.getRelatedToName())
                .assignedToUserId(request.getAssignedToUserId())
                .assignedToUserName(request.getAssignedToUserName())
                .isStarred(request.getIsStarred() != null ? request.getIsStarred() : false)
                .isRead(request.getIsRead() != null ? request.getIsRead() : true)
                .attachmentNames(request.getAttachmentNames())
                .scheduledAt(request.getScheduledAt())
                .sentAt(sentAt)
                .deliveredAt(LocalDateTime.now())
                .build();

        CommunicationLog saved = repository.save(entity);
        log.info("Created communication message log #{} [Channel: {}]", saved.getId(), saved.getChannel());
        return CommunicationResponse.fromEntity(saved);
    }

    @Transactional
    public CommunicationResponse sendMessage(SendMessageRequest request) {
        String threadId = request.getThreadId();
        if (threadId == null || threadId.trim().isEmpty()) {
            threadId = "THR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        String snippet = request.getBody().length() > 100
                ? request.getBody().substring(0, 97) + "..."
                : request.getBody();

        CommunicationLog entity = CommunicationLog.builder()
                .threadId(threadId)
                .channel(request.getChannel())
                .direction(CommunicationDirection.OUTGOING)
                .status(MessageStatus.SENT)
                .priority(request.getPriority() != null ? request.getPriority() : PriorityLevel.NORMAL)
                .subject(request.getSubject())
                .body(request.getBody())
                .snippet(snippet)
                .recipientName(request.getRecipientName())
                .recipientAddress(request.getRecipientAddress())
                .senderName(request.getAssignedToUserName() != null ? request.getAssignedToUserName() : "CRM Representative")
                .senderAddress("outreach@crm.internal")
                .relatedToType(request.getRelatedToType() != null ? request.getRelatedToType() : RelatedEntityType.GENERAL)
                .relatedToId(request.getRelatedToId())
                .relatedToName(request.getRelatedToName())
                .assignedToUserId(request.getAssignedToUserId())
                .assignedToUserName(request.getAssignedToUserName())
                .isStarred(false)
                .isRead(true)
                .attachmentNames(request.getAttachmentNames())
                .sentAt(LocalDateTime.now())
                .deliveredAt(LocalDateTime.now())
                .build();

        CommunicationLog saved = repository.save(entity);
        log.info("Sent instant message #{} via channel {}", saved.getId(), saved.getChannel());
        return CommunicationResponse.fromEntity(saved);
    }

    @Transactional
    public CommunicationResponse updateCommunication(Long id, UpdateCommunicationRequest request) {
        CommunicationLog entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Communication log not found with ID: " + id));

        if (request.getSubject() != null) entity.setSubject(request.getSubject());
        if (request.getBody() != null) {
            entity.setBody(request.getBody());
            entity.setSnippet(request.getBody().length() > 100 ? request.getBody().substring(0, 97) + "..." : request.getBody());
        }
        if (request.getChannel() != null) entity.setChannel(request.getChannel());
        if (request.getDirection() != null) entity.setDirection(request.getDirection());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getPriority() != null) entity.setPriority(request.getPriority());
        if (request.getRecipientName() != null) entity.setRecipientName(request.getRecipientName());
        if (request.getRecipientAddress() != null) entity.setRecipientAddress(request.getRecipientAddress());
        if (request.getSenderName() != null) entity.setSenderName(request.getSenderName());
        if (request.getSenderAddress() != null) entity.setSenderAddress(request.getSenderAddress());
        if (request.getRelatedToType() != null) entity.setRelatedToType(request.getRelatedToType());
        if (request.getRelatedToId() != null) entity.setRelatedToId(request.getRelatedToId());
        if (request.getRelatedToName() != null) entity.setRelatedToName(request.getRelatedToName());
        if (request.getAssignedToUserId() != null) entity.setAssignedToUserId(request.getAssignedToUserId());
        if (request.getAssignedToUserName() != null) entity.setAssignedToUserName(request.getAssignedToUserName());
        if (request.getIsStarred() != null) entity.setIsStarred(request.getIsStarred());
        if (request.getIsRead() != null) entity.setIsRead(request.getIsRead());
        if (request.getOpenCount() != null) entity.setOpenCount(request.getOpenCount());
        if (request.getClickCount() != null) entity.setClickCount(request.getClickCount());
        if (request.getAttachmentNames() != null) entity.setAttachmentNames(request.getAttachmentNames());
        if (request.getScheduledAt() != null) entity.setScheduledAt(request.getScheduledAt());
        if (request.getSentAt() != null) entity.setSentAt(request.getSentAt());
        if (request.getDeliveredAt() != null) entity.setDeliveredAt(request.getDeliveredAt());
        if (request.getReadAt() != null) entity.setReadAt(request.getReadAt());

        CommunicationLog saved = repository.save(entity);
        return CommunicationResponse.fromEntity(saved);
    }

    @Transactional
    public CommunicationResponse toggleStar(Long id) {
        CommunicationLog entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Communication log not found with ID: " + id));
        entity.setIsStarred(!Boolean.TRUE.equals(entity.getIsStarred()));
        return CommunicationResponse.fromEntity(repository.save(entity));
    }

    @Transactional
    public CommunicationResponse markRead(Long id, boolean isRead) {
        CommunicationLog entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Communication log not found with ID: " + id));
        entity.setIsRead(isRead);
        if (isRead && entity.getReadAt() == null) {
            entity.setReadAt(LocalDateTime.now());
            entity.setOpenCount((entity.getOpenCount() != null ? entity.getOpenCount() : 0) + 1);
        }
        return CommunicationResponse.fromEntity(repository.save(entity));
    }

    @Transactional
    public void deleteCommunication(Long id, UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        if (!scope.isAdmin) {
            throw new AccessDeniedException("Deleting communication logs is restricted to Administrators to preserve audit and interaction trails.");
        }
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Communication log not found with ID: " + id);
        }
        repository.deleteById(id);
        log.info("Admin deleted communication log #{}", id);
    }

    @Transactional(readOnly = true)
    public CommunicationStatsResponse getStats(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        String inClause = scope.getSqlInClause();

        String whereClause = "";
        if (scope.isManager) {
            whereClause = " WHERE (assigned_to_user_id IN (" + inClause + ") OR assigned_to_user_id IS NULL)";
        } else if (scope.isEmployee) {
            whereClause = " WHERE assigned_to_user_id = " + scope.currentUserId;
        }

        String andClause = whereClause.isEmpty() ? " WHERE " : whereClause + " AND ";

        long total = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + whereClause);
        long outgoing = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "direction = 'OUTGOING'");
        long incoming = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "direction = 'INCOMING'");
        long delivered = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "status IN ('DELIVERED', 'READ')");
        long read = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "status = 'READ'");
        long unread = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "is_read = false");
        long scheduled = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "status = 'SCHEDULED'");
        long starred = queryForLong("SELECT COUNT(*) FROM crm_communication_logs" + andClause + "is_starred = true");

        double deliveredRate = total > 0 ? ((double) delivered / total) * 100.0 : 0.0;
        double readRate = total > 0 ? ((double) read / total) * 100.0 : 0.0;

        Map<String, Long> byChannel = new HashMap<>();
        List<Map<String, Object>> channelRows = jdbcTemplate.queryForList(
                "SELECT channel, COUNT(*) as cnt FROM crm_communication_logs" + whereClause + " GROUP BY channel"
        );
        for (Map<String, Object> r : channelRows) {
            byChannel.put(String.valueOf(r.get("channel")), ((Number) r.get("cnt")).longValue());
        }

        Map<String, Long> byStatus = new HashMap<>();
        List<Map<String, Object>> statusRows = jdbcTemplate.queryForList(
                "SELECT status, COUNT(*) as cnt FROM crm_communication_logs" + whereClause + " GROUP BY status"
        );
        for (Map<String, Object> r : statusRows) {
            byStatus.put(String.valueOf(r.get("status")), ((Number) r.get("cnt")).longValue());
        }

        Map<String, Long> byDirection = new HashMap<>();
        List<Map<String, Object>> dirRows = jdbcTemplate.queryForList(
                "SELECT direction, COUNT(*) as cnt FROM crm_communication_logs" + whereClause + " GROUP BY direction"
        );
        for (Map<String, Object> r : dirRows) {
            byDirection.put(String.valueOf(r.get("direction")), ((Number) r.get("cnt")).longValue());
        }

        return CommunicationStatsResponse.builder()
                .totalMessages(total)
                .outgoingMessages(outgoing)
                .incomingMessages(incoming)
                .deliveredMessages(delivered)
                .readMessages(read)
                .unreadMessages(unread)
                .scheduledMessages(scheduled)
                .starredMessages(starred)
                .deliveredRate(Math.round(deliveredRate * 10.0) / 10.0)
                .readRate(Math.round(readRate * 10.0) / 10.0)
                .messagesByChannel(byChannel)
                .messagesByStatus(byStatus)
                .messagesByDirection(byDirection)
                .build();
    }

    @Transactional(readOnly = true)
    public String exportCommunicationsCsv(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Communication log export is disabled for Sales Representative accounts to prevent unauthorized data exfiltration.");
        }

        String inClause = scope.getSqlInClause();
        String whereClause = "";
        if (scope.isManager) {
            whereClause = " WHERE (assigned_to_user_id IN (" + inClause + ") OR assigned_to_user_id IS NULL)";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Message ID,Thread ID,Channel,Direction,Status,Priority,Subject,Recipient,Sender,Related Entity,Assigned Rep,Sent At\n");

        String sql = "SELECT id, thread_id, channel, direction, status, priority, subject, recipient_name, sender_name, related_to_name, assigned_to_user_name, sent_at FROM crm_communication_logs" +
                whereClause + " ORDER BY id DESC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        for (Map<String, Object> r : rows) {
            sb.append(escapeCsv(r.get("id"))).append(",")
              .append(escapeCsv(r.get("thread_id"))).append(",")
              .append(escapeCsv(r.get("channel"))).append(",")
              .append(escapeCsv(r.get("direction"))).append(",")
              .append(escapeCsv(r.get("status"))).append(",")
              .append(escapeCsv(r.get("priority"))).append(",")
              .append(escapeCsv(r.get("subject"))).append(",")
              .append(escapeCsv(r.get("recipient_name"))).append(",")
              .append(escapeCsv(r.get("sender_name"))).append(",")
              .append(escapeCsv(r.get("related_to_name"))).append(",")
              .append(escapeCsv(r.get("assigned_to_user_name"))).append(",")
              .append(escapeCsv(r.get("sent_at"))).append("\n");
        }

        return sb.toString();
    }

    @Transactional
    public GatewayConfigDTO getGatewayConfigs() {
        CommunicationGatewayConfig config = gatewayConfigRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> gatewayConfigRepository.save(CommunicationGatewayConfig.builder().build()));
        return GatewayConfigDTO.fromEntity(config);
    }

    @Transactional
    public GatewayConfigDTO updateGatewayConfigs(UpdateGatewayConfigRequest request, UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        if (!scope.isAdmin) {
            throw new AccessDeniedException("Configuring communication gateways is restricted to Administrators.");
        }

        CommunicationGatewayConfig config = gatewayConfigRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> CommunicationGatewayConfig.builder().build());

        if (request.getSmtpEnabled() != null) config.setSmtpEnabled(request.getSmtpEnabled());
        if (request.getSmtpHost() != null) config.setSmtpHost(request.getSmtpHost());
        if (request.getSmtpPort() != null) config.setSmtpPort(request.getSmtpPort());
        if (request.getSmtpUsername() != null) config.setSmtpUsername(request.getSmtpUsername());
        if (request.getSmtpFromName() != null) config.setSmtpFromName(request.getSmtpFromName());

        if (request.getSmsEnabled() != null) config.setSmsEnabled(request.getSmsEnabled());
        if (request.getTwilioAccountSid() != null) config.setTwilioAccountSid(request.getTwilioAccountSid());
        if (request.getTwilioSenderNumber() != null) config.setTwilioSenderNumber(request.getTwilioSenderNumber());

        if (request.getWhatsappEnabled() != null) config.setWhatsappEnabled(request.getWhatsappEnabled());
        if (request.getWhatsappPhoneNumberId() != null) config.setWhatsappPhoneNumberId(request.getWhatsappPhoneNumberId());
        if (request.getWhatsappBusinessAccountId() != null) config.setWhatsappBusinessAccountId(request.getWhatsappBusinessAccountId());

        if (request.getWebhookUrl() != null) config.setWebhookUrl(request.getWebhookUrl());

        CommunicationGatewayConfig saved = gatewayConfigRepository.save(config);
        log.info("Admin updated communication gateway configurations");
        return GatewayConfigDTO.fromEntity(saved);
    }

    private long queryForLong(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0L;
    }

    private String escapeCsv(Object val) {
        if (val == null) return "";
        String str = val.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}
