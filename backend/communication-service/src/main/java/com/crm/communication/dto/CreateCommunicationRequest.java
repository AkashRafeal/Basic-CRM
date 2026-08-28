package com.crm.communication.dto;

import com.crm.communication.model.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommunicationRequest {

    private String threadId;

    @NotNull(message = "Channel is required")
    private CommunicationChannel channel;

    private CommunicationDirection direction;

    private MessageStatus status;

    private PriorityLevel priority;

    @NotBlank(message = "Subject or message title is required")
    private String subject;

    @NotBlank(message = "Message body is required")
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

    private String attachmentNames;

    private LocalDateTime scheduledAt;

    private LocalDateTime sentAt;
}
