package com.crm.communication.dto;

import com.crm.communication.model.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationResponse {

    private Long id;
    private String threadId;
    private CommunicationChannel channel;
    private CommunicationDirection direction;
    private MessageStatus status;
    private PriorityLevel priority;
    private String subject;
    private String body;
    private String snippet;
    private String recipientName;
    private String recipientAddress;
    private String senderName;
    private String senderAddress;
    private RelatedEntityType relatedToType;
    private Long relatedToId;
    private String relatedToName;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Boolean isStarred;
    private Boolean isRead;
    private Integer openCount;
    private Integer clickCount;
    private String attachmentNames;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommunicationResponse fromEntity(CommunicationLog entity) {
        if (entity == null) return null;
        return CommunicationResponse.builder()
                .id(entity.getId())
                .threadId(entity.getThreadId())
                .channel(entity.getChannel())
                .direction(entity.getDirection())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .subject(entity.getSubject())
                .body(entity.getBody())
                .snippet(entity.getSnippet())
                .recipientName(entity.getRecipientName())
                .recipientAddress(entity.getRecipientAddress())
                .senderName(entity.getSenderName())
                .senderAddress(entity.getSenderAddress())
                .relatedToType(entity.getRelatedToType())
                .relatedToId(entity.getRelatedToId())
                .relatedToName(entity.getRelatedToName())
                .assignedToUserId(entity.getAssignedToUserId())
                .assignedToUserName(entity.getAssignedToUserName())
                .isStarred(entity.getIsStarred())
                .isRead(entity.getIsRead())
                .openCount(entity.getOpenCount())
                .clickCount(entity.getClickCount())
                .attachmentNames(entity.getAttachmentNames())
                .scheduledAt(entity.getScheduledAt())
                .sentAt(entity.getSentAt())
                .deliveredAt(entity.getDeliveredAt())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
